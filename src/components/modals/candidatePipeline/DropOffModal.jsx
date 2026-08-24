import React, { useEffect, useRef, useState } from "react";
import {
  textareaClass,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";
import { dropOffCategoryOptions } from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";
import {
  ChevronDown,
  UserX,
  Loader2,
} from "lucide-react";

import CandidatePipelineModalShell, {
  CandidateModalPrimaryButton,
  CandidateModalSecondaryButton,
  CandidateModalSection,
} from "../../recruitment/candidatePipeline/CandidatePipelineModalShell";
import CandidateModalSummary from "../../recruitment/candidatePipeline/CandidateModalSummary";

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
        className={`flex h-8.5 2xl:h-10 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-3 text-left sibs-text-xs font-bold shadow-sm outline-none transition ${
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
    if (!open) setCategoryError("");
  }, [open]);

  useEffect(() => {
    setCategoryError("");
  }, [candidate?.id, candidate?.candidateId]);

  if (!open || !candidate) return null;

  const selectedCategory = cleanText(form?.category);
  const dropOffReason = cleanText(form?.reason);

  function handleCategoryChange(category) {
    setForm({ ...form, category });
    if (categoryError) setCategoryError("");
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

  const footer = (
    <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
      <CandidateModalSecondaryButton
        type="button"
        onClick={onClose}
        disabled={processSubmitting}
      >
        Cancel
      </CandidateModalSecondaryButton>

      <CandidateModalPrimaryButton
        type="button"
        onClick={handleSubmit}
        disabled={processSubmitting || !selectedCategory || !dropOffReason}
        className="min-w-[150px] bg-red-600 hover:bg-red-700 focus-visible:ring-red-200"
      >
        {processSubmitting ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <UserX size={15} />
        )}
        {processSubmitting ? "Processing..." : "Confirm Drop-off"}
      </CandidateModalPrimaryButton>
    </div>
  );

  return (
    <CandidatePipelineModalShell
      icon={UserX}
      title="Mark Candidate as Drop-off"
      subtitle="Capture the exit reason before removing this candidate from the active recruitment pipeline."
      badge="Consequential Action"
      onClose={onClose}
      closeDisabled={processSubmitting}
      maxWidth="max-w-2xl"
      zIndex="z-[10003]"
      footer={footer}
    >
      <div className="space-y-4">
        <CandidateModalSummary
          candidate={candidate}
          stage={candidate.currentStage || "Drop-off"}
          statusClass="border-red-100 bg-red-50 text-red-700"
        />

        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <UserX size={17} className="mt-0.5 shrink-0 text-red-600" />
            <div>
              <p className="sibs-text-xs font-extrabold text-red-700">
                Candidate will be removed from the active pipeline
              </p>
              <p className="mt-1 text-[10px] font-semibold leading-5 text-red-600/90">
                The selected reason and remarks will become part of the candidate recruitment history.
              </p>
            </div>
          </div>
        </div>

        <CandidateModalSection title="Drop-off Details">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative z-[50]">
              <label className="mb-1.5 block sibs-kicker text-sibs-primary-1">
                Reason Category <span className="text-red-500">*</span>
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
                <p className="mt-2 text-[10px] font-extrabold text-red-600">
                  {categoryError}
                </p>
              )}
            </div>

            <label className="block">
              <span className="mb-1.5 block sibs-kicker text-sibs-primary-1">
                Drop-off Reason <span className="text-red-500">*</span>
              </span>
              <textarea
                required
                disabled={processSubmitting}
                rows={4}
                value={form?.reason || ""}
                onChange={(event) =>
                  setForm({ ...form, reason: event.target.value })
                }
                className={textareaClass()}
                placeholder="Enter the reason for dropping off this candidate."
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block sibs-kicker text-sibs-primary-1">
                Internal Remarks
              </span>
              <textarea
                rows={3}
                disabled={processSubmitting}
                value={form?.remarks || ""}
                onChange={(event) =>
                  setForm({ ...form, remarks: event.target.value })
                }
                className={textareaClass()}
                placeholder="Add optional remarks."
              />
            </label>
          </form>
        </CandidateModalSection>
      </div>
    </CandidatePipelineModalShell>
  );
};

export default DropOffModal;
