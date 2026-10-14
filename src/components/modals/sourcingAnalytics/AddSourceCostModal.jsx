import { formatHrisDateLocalized } from "@/lib/axios/dateFormatter";
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Loader2,
  ReceiptText,
  RotateCcw,
  Save,
} from "lucide-react";
import { useSourcingAnalytics } from "../../../services/context/SourcingContext";
import ModalShell from "../../ui/ModalShell";
import SelectDropdown from "../../ui/SelectDropdown";
import DatePicker from "../../ui/DatePicker";

const initialForm = {
  source: "",
  description: "",
  amount: "",
  dateFrom: "",
  dateTo: "",
};

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayISO() {
  return toDateInputValue(new Date());
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
      {children}
      {required && <span className="text-sibs-orange"> *</span>}
    </label>
  );
}

function TextInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`sibs-input ${className}`}
    />
  );
}

function TextArea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`sibs-modal-textarea ${className}`}
    />
  );
}

function formatShortDate(value) {
  if (!value) return "";

  const [year, month, day] = String(value).split("-").map(Number);

  if (!year || !month || !day) return "";

  const parsed = new Date(year, month - 1, day);

  if (Number.isNaN(parsed.getTime())) return "";

  return formatHrisDateLocalized(parsed, "en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function findOverlappingCostEntry(costEntries = [], form = {}) {
  if (!form.source || !form.dateFrom || !form.dateTo) {
    return null;
  }

  const source = String(form.source).trim().toLowerCase();

  return (
    (Array.isArray(costEntries) ? costEntries : []).find((entry) => {
      const entrySource = String(entry?.source || "").trim().toLowerCase();
      const entryDateFrom = entry?.dateFrom || entry?.date_from;
      const entryDateTo = entry?.dateTo || entry?.date_to;

      if (!entrySource || entrySource !== source) return false;
      if (!entryDateFrom || !entryDateTo) return false;

      return entryDateFrom <= form.dateTo && entryDateTo >= form.dateFrom;
    }) || null
  );
}

export default function AddSourceCostModal({ open, onClose, onStatus }) {
  const {
    createSourceCostEntry,
    addSourceCost,
    costEntries = [],
    sourcingOptions = [],
    fetchSourcingOptions,
  } = useSourcingAnalytics();

  const sourceOptions = useMemo(() => {
    return sourcingOptions
      .map((option) => {
        if (typeof option === "string") {
          const val = option.trim();
          return val ? { value: val, label: val } : null;
        }

        const val = String(
          option?.value ||
            option?.optionValue ||
            option?.option_value ||
            option?.label ||
            option?.optionLabel ||
            option?.option_label ||
            "",
        ).trim();

        const lbl = String(
          option?.label ||
            option?.optionLabel ||
            option?.option_label ||
            val,
        ).trim();

        return val ? { value: val, label: lbl } : null;
      })
      .filter(Boolean);
  }, [sourcingOptions]);

  const [form, setForm] = useState({
    ...initialForm,
    dateFrom: getTodayISO(),
    dateTo: getTodayISO(),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (open) {
      handleReset();
    }
  }, [open]);

  useEffect(() => {
    if (
      !open ||
      sourceOptions.length > 0 ||
      !fetchSourcingOptions
    ) {
      return;
    }

    let active = true;

    async function loadOptions() {
      setIsLoadingOptions(true);

      try {
        await fetchSourcingOptions();
      } catch (error) {
        if (!active) return;

        onStatus?.({
          type: "error",
          title: "Unable to Load Options",
          message:
            error?.message ||
            "Unable to load sourcing options from Talent Pool settings.",
        });
      } finally {
        if (active) {
          setIsLoadingOptions(false);
        }
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [
    open,
    sourceOptions.length,
    fetchSourcingOptions,
    onStatus,
  ]);

  if (!open) return null;

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleReset() {
    const today = getTodayISO();

    setForm({
      ...initialForm,
      dateFrom: today,
      dateTo: today,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.source) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Sourcing option is required.",
      });
      return;
    }

    if (!form.description.trim()) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Description is required.",
      });
      return;
    }

    if (form.amount === "" || Number(form.amount) <= 0) {
      onStatus?.({
        type: "error",
        title: "Invalid Amount",
        message: "Amount must be greater than 0.",
      });
      return;
    }

    if (!form.dateFrom) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Date From is required.",
      });
      return;
    }

    if (!form.dateTo) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Date To is required.",
      });
      return;
    }

    if (form.dateTo < form.dateFrom) {
      onStatus?.({
        type: "error",
        title: "Invalid Date Range",
        message: "Date To cannot be earlier than Date From.",
      });
      return;
    }

    const conflictingEntry = findOverlappingCostEntry(
      costEntries,
      form,
    );

    if (conflictingEntry) {
      onStatus?.({
        type: "error",
        title: "Campaign Date Conflict",
        message: `This source already has a campaign from ${formatShortDate(conflictingEntry.dateFrom || conflictingEntry.date_from)} to ${formatShortDate(conflictingEntry.dateTo || conflictingEntry.date_to)}. Choose another date range or edit the existing campaign.`,
      });
      return;
    }

    const payload = {
      source: form.source,
      description: form.description.trim(),
      amount: Number(form.amount || 0),
      dateFrom: form.dateFrom,
      dateTo: form.dateTo,
    };

    setIsSubmitting(true);

    try {
      const submitter = createSourceCostEntry || addSourceCost;

      if (!submitter) {
        throw new Error(
          "SourcingAnalyticsContext is missing createSourceCostEntry.",
        );
      }

      await submitter(payload);

      onStatus?.({
        type: "success",
        title: "Source Cost Added",
        message: "Source cost entry has been added successfully.",
      });

      handleReset();
      onClose?.();
    } catch (error) {
      onStatus?.({
        type: "error",
        title: "Submission Failed",
        message: error?.message || "Unable to add source cost entry.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      variant="navy"
      maxWidth="max-w-2xl 2xl:max-w-3xl"
      className="rounded-[14px]"
      headerClassName="rounded-t-[14px]"
      icon={ReceiptText}
      badge="Sourcing Cost"
      title="Register Source Cost Entry"
      subtitle="Record a sourcing expense and the recruiting period covered."
      bodyClassName="bg-sibs-surface p-3 sm:p-4 2xl:p-5"
      footerMeta={
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          className="sibs-modal-btn-secondary w-full sm:w-auto"
          title="Reset cost entry form"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      }
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="sibs-modal-btn-secondary w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-source-cost-form"
            disabled={isSubmitting}
            className="sibs-modal-btn-primary w-full sm:w-auto"
            title="Save this cost entry"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Cost Entry</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="add-source-cost-form" onSubmit={handleSubmit}>
        <section className="rounded-[14px] border border-sibs-border bg-white p-3.5 sm:p-4 2xl:p-5 shadow-[0_8px_24px_rgba(4,44,81,0.04)]">
          <div className="mb-3 2xl:mb-4 border-b border-sibs-border pb-2.5 2xl:pb-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-sibs-navy">
              Cost Information
            </h3>

            <p className="mt-0.5 text-xs font-semibold text-sibs-muted">
              Fields marked with an asterisk are required.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <FieldLabel required>Sourcing Option</FieldLabel>

              <SelectDropdown
                value={form.source}
                options={sourceOptions}
                onChange={(value) => updateField("source", value)}
                placeholder={
                  isLoadingOptions
                    ? "Loading sourcing options..."
                    : "Select sourcing option"
                }
                disabled={isSubmitting || isLoadingOptions}
                clearable={false}
                searchable
              />
            </div>

            <div>
              <FieldLabel required>Description</FieldLabel>

              <TextArea
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                disabled={isSubmitting}
                placeholder="Example: Facebook Ads - CSR Hiring Campaign"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <FieldLabel required>Amount</FieldLabel>

                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) =>
                    updateField("amount", event.target.value)
                  }
                  disabled={isSubmitting}
                  placeholder="Example: 10000"
                />
              </div>

              <div>
                <FieldLabel required>Date From</FieldLabel>

                <DatePicker
                  value={form.dateFrom}
                  onChange={(value) => {
                    updateField("dateFrom", value);

                    if (value && form.dateTo && form.dateTo < value) {
                      updateField("dateTo", value);
                    }
                  }}
                  disabled={isSubmitting}
                  placeholder="Select date from"
                  clearable={false}
                />
              </div>

              <div>
                <FieldLabel required>Date To</FieldLabel>

                <DatePicker
                  value={form.dateTo}
                  min={form.dateFrom || undefined}
                  onChange={(value) => updateField("dateTo", value)}
                  disabled={isSubmitting}
                  placeholder="Select date to"
                  clearable={false}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[10px] border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-extrabold text-sibs-navy">
            Cost per Hire Formula
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-sibs-navy/75">
            Cost per Hire equals Total Source Cost divided by hires from candidates who
            selected the same source. The entry becomes completed automatically after
            Date To.
          </p>
        </section>
      </form>
    </ModalShell>
  );
}
