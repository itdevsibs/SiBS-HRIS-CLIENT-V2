import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { prfStatusOptions } from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";
import { getPrfStatusClass } from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeOptions(options = []) {
  return options
    .map((option) => {
      if (typeof option === "string" || typeof option === "number") {
        return {
          value: String(option),
          label: String(option),
          description:
            String(option) === "Matched"
              ? "Candidate can move to Online Assessment."
              : "Candidate is not yet matched to the PRF.",
        };
      }

      return {
        value: cleanText(option?.value || option?.id || option?.label),
        label: cleanText(option?.label || option?.value || option?.id),
        description: cleanText(option?.description),
      };
    })
    .filter((option) => option.value && option.label);
}

function PrfStatusDropdown({
  value,
  options,
  onChange,
  placeholder = "Select PRF status",
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(() => {
    return options.find((option) => String(option.value) === String(value));
  }, [options, value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
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

  function handleSelect(option) {
    onChange?.(option.value);
    setOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${open ? "z-[10080]" : "z-[1]"}`}
    >
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-12 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-extrabold shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD] hover:border-sibs-primary-1/50 hover:bg-[#F8FAFC]"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? "text-sibs-primary-1" : "text-sibs-tertiary-5"
          }`}
        >
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-primary-1 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[10090] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="max-h-72 overflow-y-auto py-1">
            {options.map((option) => {
              const active = String(option.value) === String(value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                    active
                      ? "bg-[#EAF4FF] text-sibs-primary-1"
                      : "bg-white text-[#344054] hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      active
                        ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
                        : "border-[#D0D5DD] bg-white text-transparent"
                    }`}
                  >
                    <Check size={13} strokeWidth={3} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold">
                      {option.label}
                    </span>

                    {option.description && (
                      <span className="mt-0.5 block text-xs font-semibold leading-5 text-sibs-tertiary-5">
                        {option.description}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const LeadPrfReviewCard = ({ candidate, onUpdatePrfStatus }) => {
  const currentStatus = cleanText(candidate?.prfStatus) || "Unmatched";

  const options = useMemo(() => {
    const normalized = normalizeOptions(prfStatusOptions);

    if (normalized.length) return normalized;

    return normalizeOptions(["Unmatched", "Matched"]);
  }, []);

  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus, candidate?.id, candidate?.candidateId]);

  async function handleStatusChange(nextStatus) {
    if (!nextStatus || nextStatus === currentStatus) {
      setSelectedStatus(currentStatus);
      return;
    }

    setSelectedStatus(nextStatus);

    const response = await onUpdatePrfStatus?.(candidate, nextStatus);

    if (response === null || response?.success === false) {
      setSelectedStatus(currentStatus);
    }
  }

  return (
    <div className="relative z-[80] overflow-visible rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#101828]">PRF Review</h3>

          <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
            Select the lead PRF status before moving forward.
          </p>
        </div>

        <span
          className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${getPrfStatusClass(
            currentStatus,
          )}`}
        >
          Current: {currentStatus}
        </span>
      </div>

      <div className="relative z-[90] mt-4 overflow-visible">
        <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
          PRF Status
        </label>

        <PrfStatusDropdown
          value={selectedStatus}
          options={options}
          onChange={handleStatusChange}
          placeholder="Select PRF status"
        />

        <p className="mt-2 text-xs font-semibold leading-5 text-sibs-tertiary-5">
          Changing this value will immediately update the candidate PRF review
          status.
        </p>
      </div>
    </div>
  );
};

export default LeadPrfReviewCard;