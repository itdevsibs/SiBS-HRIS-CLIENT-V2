import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Compass,
  DollarSign,
  Edit2,
  Info,
  Loader2,
  Plus,
  ReceiptText,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { useSourcingAnalytics } from "../../../services/context/SourcingContext";

const EMPTY_EXPENSE_FORM = {
  source: "",
  description: "",
  amount: "",
  dateFrom: "",
  dateTo: "",
};

const FIELD_CLASS =
  "h-10 w-full rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#667085]";

const TEXTAREA_CLASS =
  "w-full resize-none rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2.5 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#667085]";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeDate(value) {
  const text = cleanText(value);

  if (!text) return "";

  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);

  return match?.[1] || text;
}

function getTodayISO() {
  const now = new Date();
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 10);
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
  const safeHired = Number(hired || 0);
  const safeValue = Number(value);

  if (
    safeHired <= 0 ||
    value === null ||
    value === undefined ||
    !Number.isFinite(safeValue)
  ) {
    return "—";
  }

  return formatCurrency(safeValue);
}

function formatDate(value) {
  const normalized = normalizeDate(value);

  if (!normalized) return "—";

  const parsed = new Date(`${normalized}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return "—";

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

  if (formattedFrom === "—" && formattedTo === "—") {
    return "—";
  }

  if (formattedFrom === formattedTo) {
    return formattedFrom;
  }

  return `${formattedFrom} – ${formattedTo}`;
}

function getExpenseStatus(entry = {}) {
  const suppliedStatus = cleanText(entry.status);

  if (suppliedStatus) return suppliedStatus;

  const today = getTodayISO();
  const dateFrom = normalizeDate(
    entry.dateFrom ||
      entry.date_from ||
      entry.dateSpent ||
      entry.date_spent,
  );
  const dateTo = normalizeDate(
    entry.dateTo ||
      entry.date_to ||
      entry.dateSpent ||
      entry.date_spent,
  );

  if (dateFrom && today < dateFrom) return "Upcoming";
  if (dateTo && today > dateTo) return "Completed";

  return "Ongoing";
}

function getExpenseStatusClass(status) {
  switch (cleanText(status).toLowerCase()) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "ongoing":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "upcoming":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getSourcePerformance(source = {}) {
  const item = source || {};

  if (Number(item.hired || 0) > 0) {
    return {
      label: "With Hires",
      className:
        "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    };
  }

  if (Number(item.volume || 0) > 0) {
    return {
      label: "With Applicants",
      className:
        "border-blue-300/30 bg-blue-300/10 text-blue-100",
    };
  }

  return {
    label: "No Applicants",
    className:
      "border-white/15 bg-white/10 text-slate-200",
  };
}

function FormLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-[#475467]">
      {children}
      {required ? (
        <span className="ml-1 text-red-500">*</span>
      ) : null}
    </label>
  );
}

function ModalMessage({ type = "error", children }) {
  if (!children) return null;

  const isSuccess = type === "success";

  return (
    <div
      className={`rounded-[10px] border px-3.5 py-2.5 text-xs font-semibold ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {children}
    </div>
  );
}

function MetricTile({
  label,
  value,
  helper,
  icon: Icon,
  accentClassName = "text-white",
  iconClassName = "text-slate-300",
  className = "",
}) {
  return (
    <article
      className={`min-w-0 rounded-2xl border border-[#0A3D6C] bg-[#042C51] p-3.5 shadow-sm transition hover:border-[#FF5C28]/40 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={`text-[10px] font-extrabold uppercase tracking-wide ${accentClassName}`}>
          {label}
        </p>

        <Icon size={14} className={iconClassName} />
      </div>

      <p
        className={`mt-1.5 truncate text-xl font-black leading-none ${accentClassName}`}
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </p>

      <p className="mt-1.5 truncate text-[10px] font-semibold text-slate-300/80">
        {helper}
      </p>
    </article>
  );
}

function FunnelStage({ stage }) {
  const percentage = Math.min(
    Math.max(Number(stage.percentage || 0), 0),
    100,
  );

  return (
    <div className="space-y-1.5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-[#042C51]">
            {stage.label}
          </p>

          <p className="text-[10px] font-semibold text-[#98A2B3]">
            {stage.helper}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-extrabold text-[#344054]">
            {stage.value.toLocaleString("en-PH")} candidates
          </span>

          <span
            className={`inline-flex min-w-[58px] justify-center rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${stage.badgeClassName}`}
          >
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-200/80 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${stage.barClassName}`}
          style={{ width: `${Math.max(percentage, stage.value > 0 ? 3 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function ExpenseStatusBadge({ entry }) {
  const status = getExpenseStatus(entry);
  const Icon =
    status === "Completed"
      ? CheckCircle2
      : status === "Upcoming"
        ? AlertTriangle
        : Clock3;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${getExpenseStatusClass(
        status,
      )}`}
    >
      <Icon size={11} />
      {status}
    </span>
  );
}

export default function SourceDetailsModal({
  open,
  source,
  onClose,
}) {
  const {
    sourceRows = [],
    createSourceCostEntry,
    updateSourceCostEntry,
    deleteSourceCostEntry,
    mutating,
  } = useSourcingAnalytics();

  const [expenseMode, setExpenseMode] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [expenseForm, setExpenseForm] = useState(
    EMPTY_EXPENSE_FORM,
  );
  const [removingEntry, setRemovingEntry] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

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
  }, [sourceRows, source, sourceName]);

  const costEntries = useMemo(() => {
    return Array.isArray(liveSource?.costEntries)
      ? liveSource.costEntries
      : [];
  }, [liveSource]);

  const totalCost = Number(liveSource?.sourceCost || 0);
  const conversionRate = Number(
    liveSource?.conversionRate || 0,
  );
  const performance = getSourcePerformance(liveSource);

  const funnelStages = useMemo(() => {
    const volume = Number(liveSource?.volume || 0);

    const makeStage = (
      label,
      helper,
      value,
      barClassName,
      badgeClassName,
    ) => ({
      label,
      helper,
      value: Number(value || 0),
      percentage:
        volume > 0
          ? (Number(value || 0) / volume) * 100
          : 0,
      barClassName,
      badgeClassName,
    });

    return [
      {
        label: "Candidate Volume",
        helper: "All public applicants",
        value: volume,
        percentage: volume > 0 ? 100 : 0,
        barClassName: "bg-[#042C51]",
        badgeClassName:
          "border-slate-200 bg-slate-100 text-slate-700",
      },
      makeStage(
        "Screened",
        "Initial HR and resume fit",
        liveSource?.screened,
        "bg-blue-600",
        "border-blue-200 bg-blue-50 text-blue-700",
      ),
      makeStage(
        "Interviewed",
        "Operations and technical evaluation",
        liveSource?.interviewed,
        "bg-indigo-600",
        "border-indigo-200 bg-indigo-50 text-indigo-700",
      ),
      makeStage(
        "Offered",
        "Job offer released",
        liveSource?.offered,
        "bg-amber-500",
        "border-amber-200 bg-amber-50 text-amber-800",
      ),
      makeStage(
        "Hired",
        "Confirmed onboarded talent",
        liveSource?.hired,
        "bg-emerald-600",
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      ),
    ];
  }, [liveSource]);

  useEffect(() => {
    if (!open) {
      setExpenseMode(null);
      setEditingEntry(null);
      setExpenseForm(EMPTY_EXPENSE_FORM);
      setRemovingEntry(null);
      setActionError("");
      setActionMessage("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !liveSource) return null;

  function clearMessages() {
    setActionError("");
    setActionMessage("");
  }

  function openAddExpense() {
    clearMessages();

    const today = getTodayISO();

    setExpenseMode("add");
    setEditingEntry(null);
    setExpenseForm({
      source: sourceName,
      description: "",
      amount: "",
      dateFrom: today,
      dateTo: today,
    });
  }

  function openEditExpense(entry) {
    clearMessages();

    setExpenseMode("edit");
    setEditingEntry(entry);
    setExpenseForm({
      source: cleanText(entry?.source) || sourceName,
      description: cleanText(entry?.description),
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

  function closeExpenseForm() {
    if (isSaving || mutating) return;

    setExpenseMode(null);
    setEditingEntry(null);
    setExpenseForm(EMPTY_EXPENSE_FORM);
    setActionError("");
  }

  function updateExpenseField(key, value) {
    setExpenseForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validateExpenseForm() {
    if (!sourceName) return "Sourcing option is required.";

    if (!cleanText(expenseForm.description)) {
      return "Expense description is required.";
    }

    const amount = Number(
      String(expenseForm.amount || "")
        .replace(/,/g, "")
        .replace(/[₱\s]/g, ""),
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      return "Amount must be greater than zero.";
    }

    if (!expenseForm.dateFrom) {
      return "Date From is required.";
    }

    if (!expenseForm.dateTo) {
      return "Date To is required.";
    }

    if (expenseForm.dateTo < expenseForm.dateFrom) {
      return "Date To cannot be earlier than Date From.";
    }

    return "";
  }

  async function handleSaveExpense(event) {
    event.preventDefault();

    const validationError = validateExpenseForm();

    if (validationError) {
      setActionError(validationError);
      return;
    }

    const payload = {
      source: sourceName,
      description: cleanText(expenseForm.description),
      amount: Number(
        String(expenseForm.amount)
          .replace(/,/g, "")
          .replace(/[₱\s]/g, ""),
      ),
      dateFrom: expenseForm.dateFrom,
      dateTo: expenseForm.dateTo,
    };

    setIsSaving(true);
    setActionError("");
    setActionMessage("");

    try {
      if (expenseMode === "edit") {
        if (!editingEntry?.id) {
          throw new Error(
            "This cost entry has no database ID and cannot be edited.",
          );
        }

        await updateSourceCostEntry(
          editingEntry.id,
          payload,
        );

        setActionMessage(
          "Source cost entry updated successfully.",
        );
      } else {
        await createSourceCostEntry(payload);

        setActionMessage(
          "Source cost entry added successfully.",
        );
      }

      setExpenseMode(null);
      setEditingEntry(null);
      setExpenseForm(EMPTY_EXPENSE_FORM);
    } catch (error) {
      setActionError(
        error?.message ||
          `Failed to ${
            expenseMode === "edit" ? "update" : "add"
          } the source cost entry.`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  function openRemoveExpense(entry) {
    clearMessages();
    setRemovingEntry(entry);
  }

  function closeRemoveExpense() {
    if (isRemoving || mutating) return;

    setRemovingEntry(null);
    setActionError("");
  }

  async function handleRemoveExpense() {
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
      await deleteSourceCostEntry(removingEntry.id);

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

  return (
    <>
      <div
        className="sibs-modal-backdrop-in fixed inset-0 z-[9999] flex h-dvh items-center justify-center overflow-y-auto bg-[#042C51]/80 p-3 backdrop-blur-sm sm:p-4"
        onClick={() => {
          if (!expenseMode && !removingEntry) {
            onClose?.();
          }
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="source-performance-title"
          onClick={(event) => event.stopPropagation()}
          className="sibs-modal-pop-in my-4 flex max-h-[94dvh] w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl border border-[#9FB3C8] bg-white text-slate-900 shadow-[0_30px_90px_rgba(2,26,48,0.42)]"
        >
          <header className="relative shrink-0 overflow-hidden border-b border-[#063866] bg-[#042C51] px-4 py-4 text-white sm:px-5">
            <span
              className="pointer-events-none absolute -right-12 -top-14 h-48 w-48 rounded-full bg-[#FF5C28]/10 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-[#FF5C28] shadow-inner">
                  <Compass size={20} />
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      id="source-performance-title"
                      className="break-words text-base font-black tracking-tight text-white sm:text-lg"
                    >
                      {liveSource.source || "—"}
                    </h2>

                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${performance.className}`}
                    >
                      {performance.label}
                    </span>
                  </div>

                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300">
                    <span>Channel Sourcing Performance & Cost Metrics</span>
                    <span className="text-slate-500">•</span>
                    <span>
                      {costEntries.length} expense log
                      {costEntries.length === 1 ? "" : "s"}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={mutating || isSaving || isRemoving}
                aria-label="Close source performance modal"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4 sm:p-5">
            <div className="space-y-5">
              <div className="space-y-3">
                <ModalMessage type="success">
                  {actionMessage}
                </ModalMessage>

                {!expenseMode && !removingEntry ? (
                  <ModalMessage>{actionError}</ModalMessage>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <MetricTile
                  label="Applicants"
                  value={Number(
                    liveSource.volume || 0,
                  ).toLocaleString("en-PH")}
                  helper="Total submissions"
                  icon={UsersRound}
                />

                <MetricTile
                  label="Hired"
                  value={Number(
                    liveSource.hired || 0,
                  ).toLocaleString("en-PH")}
                  helper="Current hires"
                  icon={Award}
                  accentClassName="text-emerald-400"
                  iconClassName="text-emerald-400"
                />

                <MetricTile
                  label="Conversion"
                  value={`${conversionRate.toFixed(1)}%`}
                  helper="Hired / applicants"
                  icon={Activity}
                  accentClassName="text-indigo-300"
                  iconClassName="text-indigo-300"
                />

                <MetricTile
                  label="Total Cost"
                  value={formatCurrency(totalCost)}
                  helper={`${costEntries.length} expense logs`}
                  icon={DollarSign}
                  accentClassName="text-amber-300"
                  iconClassName="text-amber-300"
                />

                <MetricTile
                  label="Cost / Hire"
                  value={formatCostPerHire(
                    liveSource.costPerHire,
                    liveSource.hired,
                  )}
                  helper="Total cost / hires"
                  icon={TrendingUp}
                  accentClassName="text-[#FF855F]"
                  iconClassName="text-[#FF5C28]"
                  className="col-span-2 sm:col-span-1"
                />
              </div>

              <section className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-[#042C51]" />
                    <h3 className="text-xs font-black uppercase tracking-wide text-[#042C51]">
                      Candidate Recruitment Funnel
                    </h3>
                  </div>

                  <p className="text-[10px] font-semibold text-slate-500">
                    Stage progression from submission to confirmed hire
                  </p>
                </div>

                <div className="space-y-3">
                  {funnelStages.map((stage) => (
                    <FunnelStage
                      key={stage.label}
                      stage={stage}
                    />
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#042C51]">
                      <DollarSign size={16} className="text-[#FF5C28]" />
                      Channel Expense Entries & Budget Logs
                    </h3>

                    <p className="mt-1 text-[10px] font-semibold text-slate-500">
                      Track campaigns, subscriptions, advertising boosts, and direct channel outlays.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openAddExpense}
                    disabled={mutating}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-[#042C51] px-3.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={14} />
                    Add Expense Entry
                  </button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wide text-slate-600">
                        <tr className="border-b border-slate-200">
                          <th className="px-3 py-3">Entry ID</th>
                          <th className="px-3 py-3">Expense Notes & Campaign</th>
                          <th className="px-3 py-3">Covered Date Range</th>
                          <th className="px-3 py-3 text-right">Amount</th>
                          <th className="px-3 py-3 text-center">Status</th>
                          <th className="px-3 py-3 text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {costEntries.length > 0 ? (
                          costEntries.map((entry) => (
                            <tr
                              key={
                                entry.id ||
                                `${entry.description}-${entry.dateFrom}-${entry.amount}`
                              }
                              className="transition hover:bg-slate-50/80"
                            >
                              <td className="px-3 py-3 text-[10px] font-extrabold text-[#042C51]">
                                {entry.id || "—"}
                              </td>

                              <td className="px-3 py-3">
                                <p className="max-w-[340px] truncate text-xs font-extrabold text-slate-800">
                                  {entry.description || "—"}
                                </p>

                                <p className="mt-0.5 text-[9px] font-semibold text-slate-400">
                                  Database source cost entry
                                </p>
                              </td>

                              <td className="px-3 py-3 text-xs font-semibold text-slate-600">
                                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                  <CalendarDays size={13} className="text-slate-400" />
                                  {formatDateRange(entry)}
                                </span>
                              </td>

                              <td className="px-3 py-3 text-right text-xs font-black text-[#FF5C28]">
                                {formatCurrency(entry.amount)}
                              </td>

                              <td className="px-3 py-3 text-center">
                                <ExpenseStatusBadge entry={entry} />
                              </td>

                              <td className="px-3 py-3 text-right">
                                <div className="inline-flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditExpense(entry)}
                                    disabled={mutating || !entry?.id}
                                    title="Edit expense"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#042C51] disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <Edit2 size={14} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openRemoveExpense(entry)}
                                    disabled={mutating || !entry?.id}
                                    title="Remove expense"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-5 py-10 text-center">
                              <ReceiptText size={26} className="mx-auto text-slate-300" />

                              <p className="mt-3 text-xs font-extrabold text-slate-500">
                                No expense entries recorded for this channel.
                              </p>

                              <p className="mt-1 text-[10px] font-semibold text-slate-400">
                                This may be an organic channel or a source without direct expenditure.
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <article className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                    Latest Applicant
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <UserRound size={16} className="shrink-0 text-[#042C51]" />
                    <p className="min-w-0 truncate text-xs font-black text-[#042C51]">
                      {liveSource.latestCandidate || "None yet"}
                    </p>
                  </div>

                  <p className="mt-1.5 text-[10px] font-semibold text-slate-500">
                    Most recent public form enrollment
                  </p>
                </article>

                <article className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                    Last Activity
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <Clock3 size={16} className="shrink-0 text-[#FF5C28]" />
                    <p className="text-xs font-black text-[#042C51]">
                      {formatDate(liveSource.lastActivity)}
                    </p>
                  </div>

                  <p className="mt-1.5 text-[10px] font-semibold text-slate-500">
                    Most recent candidate or cost activity
                  </p>
                </article>

                <article className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                  <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-900">
                    <Info size={14} className="text-amber-700" />
                    Cost per Hire Formula
                  </p>

                  <p className="mt-2 text-[11px] font-extrabold text-amber-900">
                    CPH = Total Channel Expenses ÷ Total Hires
                  </p>

                  <p className="mt-1.5 text-[10px] font-semibold leading-4 text-amber-800">
                    Recalculated from current database-backed source cost and hired-candidate totals.
                  </p>
                </article>
              </div>
            </div>
          </div>

          <footer className="flex shrink-0 flex-col gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
              <Sparkles size={15} className="text-[#FF5C28]" />
              <span>Live ROI metrics refresh after each database update.</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={mutating || isSaving || isRemoving}
              className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[#042C51] px-5 text-xs font-extrabold text-white transition hover:bg-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Done
            </button>
          </footer>
        </section>
      </div>

      {expenseMode ? (
        <div
          className="sibs-modal-backdrop-in fixed inset-0 z-[10000] flex h-dvh items-end justify-center bg-[#042C51]/80 p-3 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={closeExpenseForm}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-form-title"
            onSubmit={handleSaveExpense}
            onClick={(event) => event.stopPropagation()}
            className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#9FB3C8] bg-white shadow-[0_30px_90px_rgba(2,26,48,0.42)] sm:rounded-2xl"
          >
            <header className="flex items-start justify-between gap-4 bg-[#042C51] px-4 py-4 text-white sm:px-5">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#FF5C28]">
                  <DollarSign size={17} />
                </span>

                <div className="min-w-0">
                  <span className="inline-flex rounded bg-[#FF5C28] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                    Source Cost Entry
                  </span>

                  <h3
                    id="expense-form-title"
                    className="mt-1 text-sm font-black text-white"
                  >
                    {expenseMode === "edit"
                      ? "Edit Expense Entry"
                      : "Add Expense Entry"}
                  </h3>

                  <p className="mt-0.5 text-[10px] font-semibold text-slate-300">
                    {sourceName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeExpenseForm}
                disabled={isSaving || mutating}
                aria-label="Close expense form"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-white p-4 sm:p-5">
              <ModalMessage>{actionError}</ModalMessage>

              <div>
                <FormLabel>Sourcing Option</FormLabel>
                <div className="flex h-10 items-center rounded-[10px] border border-[#D7DEE8] bg-[#F2F4F7] px-3 text-xs font-semibold text-[#667085]">
                  {sourceName || "—"}
                </div>
                <p className="mt-1 text-[10px] font-semibold text-[#98A2B3]">
                  The sourcing channel is fixed for this expense.
                </p>
              </div>

              <div>
                <FormLabel required>
                  Expense Description & Campaign Notes
                </FormLabel>
                <textarea
                  rows={3}
                  value={expenseForm.description}
                  onChange={(event) =>
                    updateExpenseField(
                      "description",
                      event.target.value,
                    )
                  }
                  disabled={isSaving || mutating}
                  placeholder="Describe the campaign, subscription, event, or sourcing expense."
                  className={TEXTAREA_CLASS}
                />
              </div>

              <div>
                <FormLabel required>Expense Amount</FormLabel>
                <div className="flex h-10 overflow-hidden rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] focus-within:border-[#FF5C28] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#FF5C28]/10">
                  <span className="flex items-center border-r border-[#E6ECF2] bg-[#F2F4F7] px-3 text-sm font-extrabold text-[#042C51]">
                    ₱
                  </span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(event) =>
                      updateExpenseField(
                        "amount",
                        event.target.value,
                      )
                    }
                    disabled={isSaving || mutating}
                    placeholder="0.00"
                    className="min-w-0 flex-1 bg-transparent px-3 text-xs font-semibold text-[#042C51] outline-none disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FormLabel required>Date From</FormLabel>
                  <input
                    type="date"
                    value={expenseForm.dateFrom}
                    onChange={(event) => {
                      const nextDateFrom = event.target.value;

                      setExpenseForm((current) => ({
                        ...current,
                        dateFrom: nextDateFrom,
                        dateTo:
                          current.dateTo &&
                          current.dateTo < nextDateFrom
                            ? nextDateFrom
                            : current.dateTo,
                      }));
                    }}
                    disabled={isSaving || mutating}
                    className={FIELD_CLASS}
                  />
                </div>

                <div>
                  <FormLabel required>Date To</FormLabel>
                  <input
                    type="date"
                    min={expenseForm.dateFrom || undefined}
                    value={expenseForm.dateTo}
                    onChange={(event) =>
                      updateExpenseField(
                        "dateTo",
                        event.target.value,
                      )
                    }
                    disabled={isSaving || mutating}
                    className={FIELD_CLASS}
                  />
                </div>
              </div>
            </div>

            <footer className="flex flex-col-reverse gap-2 border-t border-[#E6ECF2] bg-slate-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-5">
              <button
                type="button"
                onClick={closeExpenseForm}
                disabled={isSaving || mutating}
                className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[#D7DEE8] bg-white px-4 text-xs font-extrabold text-[#042C51] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving || mutating}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#042C51] px-5 text-xs font-black text-white transition hover:bg-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving || mutating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {expenseMode === "edit" ? (
                      <Edit2 size={15} />
                    ) : (
                      <Plus size={15} />
                    )}
                    Save Expense
                  </>
                )}
              </button>
            </footer>
          </form>
        </div>
      ) : null}

      {removingEntry ? (
        <div
          className="sibs-modal-backdrop-in fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-[#042C51]/80 p-4 backdrop-blur-sm"
          onClick={closeRemoveExpense}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-expense-title"
            onClick={(event) => event.stopPropagation()}
            className="sibs-modal-pop-in w-full max-w-sm overflow-hidden rounded-2xl border border-[#9FB3C8] bg-white text-center shadow-[0_30px_90px_rgba(2,26,48,0.42)]"
          >
            <div className="p-5">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <Trash2 size={22} />
              </span>

              <h3
                id="remove-expense-title"
                className="mt-4 text-base font-black text-[#042C51]"
              >
                Remove Expense Entry?
              </h3>

              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                Remove this database-backed cost entry? Source cost and cost-per-hire totals will refresh after the update.
              </p>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left">
                <p className="truncate text-xs font-extrabold text-slate-800">
                  {removingEntry.description || "—"}
                </p>
                <p className="mt-1 text-[10px] font-semibold text-slate-500">
                  {formatDateRange(removingEntry)}
                </p>
                <p className="mt-2 font-mono text-sm font-black text-[#FF5C28]">
                  {formatCurrency(removingEntry.amount)}
                </p>
              </div>

              <div className="mt-4">
                <ModalMessage>{actionError}</ModalMessage>
              </div>
            </div>

            <footer className="flex justify-center gap-2.5 border-t border-slate-200 bg-slate-50 px-4 py-4">
              <button
                type="button"
                onClick={closeRemoveExpense}
                disabled={isRemoving || mutating}
                className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[#D7DEE8] bg-white px-4 text-xs font-extrabold text-[#042C51] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRemoveExpense}
                disabled={isRemoving || mutating}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-red-600 px-4 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRemoving || mutating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Yes, Remove Entry
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}