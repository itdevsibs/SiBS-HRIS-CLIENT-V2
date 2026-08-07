import React, { useEffect, useRef, useState } from "react";
import {
  textareaClass,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";
import { dropOffCategoryOptions } from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";
import {
  ChevronDown,
  UserX,
  X,
  Loader2,
} from "lucide-react";

function cleanText(value) {
  return String(value ?? "").trim();
}

function DropOffCategoryDropdown({
  value,
  options = [],
  placeholder = "Select category",
  disabled = false,
  hasError = false,
  onChange,
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedOption = options.find(
    (option) => String(option) === String(value || ""),
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  function handleToggle() {
    if (disabled) return;

    setOpen((previous) => !previous);
  }

  function handleSelect(option) {
    if (disabled) return;

    onChange?.(option);
    setOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${
        open ? "z-[100]" : "z-[1]"
      }`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold shadow-sm outline-none transition ${
          hasError
            ? "border-red-400 ring-4 ring-red-100"
            : open
              ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
              : "border-[#D6DEE8] hover:border-sibs-primary-1"
        } ${
          disabled
            ? "cursor-not-allowed bg-slate-100 text-slate-400 opacity-70"
            : "text-[#344054]"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption
              ? "text-[#344054]"
              : "text-[#98A2B3]"
          }`}
        >
          {selectedOption || placeholder}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-primary-1 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[99999] w-full overflow-hidden rounded-xl border border-[#D6DEE8] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
          <div
            role="listbox"
            aria-label="Drop-off reason category"
            className="max-h-[260px] overflow-y-auto py-1"
          >
            {options.length > 0 ? (
              options.map((option) => {
                const active =
                  String(option) === String(value || "");

                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => handleSelect(option)}
                    className={`flex min-h-[44px] w-full items-center px-4 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-[#EAF2FB] text-sibs-primary-1"
                        : "bg-white text-[#475467] hover:bg-[#F8FAFC] hover:text-sibs-primary-1"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {option}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm font-semibold text-[#98A2B3]">
                No categories available.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const DropOffModal = ({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onSubmit,
}) => {
  const [categoryError, setCategoryError] = useState("");
  const [processSubmitting, setProcessSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setCategoryError("");
    }
  }, [open]);

  useEffect(() => {
    setCategoryError("");
  }, [candidate?.id, candidate?.candidateId]);

  if (!open || !candidate) return null;

  const selectedCategory = cleanText(form?.category);
  const dropOffReason = cleanText(form?.reason);

  function handleCategoryChange(category) {
    setForm({
      ...form,
      category,
    });

    if (categoryError) {
      setCategoryError("");
    }
  }

  function handleSubmit(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!selectedCategory) {
      setCategoryError("Please select a reason category.");
      return;
    }

    if (processSubmitting) return;

    setProcessSubmitting(true);

    Promise.resolve(onSubmit?.(event)).finally(() => {
      setProcessSubmitting(false);
    });
  }

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[10003] flex h-dvh items-center justify-center px-4 py-4"
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-visible rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 rounded-t-2xl border-b border-gray-100 bg-white px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Mark Candidate as Drop-off
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Capture reason before removing from active pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={processSubmitting}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close Drop-off modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4 sm:p-6">
          <div className="space-y-5">
            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
              <h3 className="break-words text-lg font-bold text-sibs-primary-1">
                {candidate.name || candidate.candidateName || "Candidate"}
              </h3>

              <p className="mt-1 break-words text-sm font-semibold text-sibs-primary-1/80">
                {candidate.roleAccount ||
                  candidate.currentAppliedRole ||
                  candidate.openPosition ||
                  "Not assigned yet"}
              </p>
            </div>

            <div className="relative z-[50]">
              <label className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Reason Category{" "}
                <span className="text-red-500">*</span>
              </label>

              <DropOffCategoryDropdown
                value={form?.category || ""}
                options={dropOffCategoryOptions}
                placeholder="Select category"
                disabled={processSubmitting}
                hasError={Boolean(categoryError)}
                onChange={handleCategoryChange}
              />

              {categoryError && (
                <p className="mt-2 text-xs font-bold text-red-600">
                  {categoryError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="drop-off-reason"
                className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1"
              >
                Drop-off Reason{" "}
                <span className="text-red-500">*</span>
              </label>

              <textarea
                id="drop-off-reason"
                required
                disabled={processSubmitting}
                rows={4}
                value={form?.reason || ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    reason: event.target.value,
                  })
                }
                className={textareaClass()}
                placeholder="Enter the reason for dropping off this candidate."
              />
            </div>

            <div>
              <label
                htmlFor="drop-off-remarks"
                className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1"
              >
                Remarks
              </label>

              <textarea
                id="drop-off-remarks"
                rows={3}
                disabled={processSubmitting}
                value={form?.remarks || ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    remarks: event.target.value,
                  })
                }
                className={textareaClass()}
                placeholder="Add optional remarks."
              />
            </div>
          </div>
        </div>

        <div className="rounded-b-2xl border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={processSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={processSubmitting || !selectedCategory || !dropOffReason}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
            >
              {processSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UserX size={16} />
                  Confirm Drop-off
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DropOffModal;
