import React, { useEffect, useRef } from "react";

import { hasValue } from "../../../../lib/utils/employees/employeeProfileHelpers.js";
import DatePicker from "../../../ui/DatePicker.jsx";
import MonthYearPicker from "../../../ui/MonthYearPicker.jsx";
import SelectDropdown from "../../../ui/SelectDropdown.jsx";

function resizeProfileTextarea(element) {
  if (!element) return;

  element.style.height = "auto";
  element.style.height = `${Math.max(element.scrollHeight, 36)}px`;
}

function AutoGrowProfileTextarea({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  className,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    resizeProfileTextarea(textareaRef.current);
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      aria-label={label}
      disabled={disabled}
      value={value || ""}
      onChange={(event) => {
        onChange?.(event.target.value);
        resizeProfileTextarea(event.currentTarget);
      }}
      placeholder={placeholder}
      className={`${className} min-h-[32px] 2xl:min-h-[36px] resize-none overflow-hidden py-2 leading-snug`}
    />
  );
}

export function ProfileReadField({
  label,
  value,
  mono = false,
  className = "",
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 text-left font-jakarta ${className}`}>
      <span className="block sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-faint">
        {label}
      </span>
      <div className="flex min-h-[34px] 2xl:min-h-[38px] items-center rounded-xl border border-sibs-border bg-sibs-surface px-2.5 py-1.5 2xl:px-3 2xl:py-2 transition-colors duration-150">
        <span
          className={`block min-w-0 break-words sibs-text-xs 2xl:sibs-text-sm font-semibold leading-snug ${
            hasValue(value) ? "text-sibs-secondary" : "text-sibs-faint"
          } ${mono ? "font-mono" : ""}`}
        >
          {hasValue(value) ? value : "—"}
        </span>
      </div>
    </div>
  );
}

export function ProfileFieldControl({
  label,
  value,
  displayValue,
  onChange,
  type = "text",
  options = [],
  required = false,
  disabled = false,
  rows = 3,
  placeholder = "",
  className = "",
}) {
  const common =
    "w-full rounded-xl border border-slate-300 bg-white px-2.5 2xl:px-3 sibs-text-xs 2xl:sibs-text-sm font-semibold text-sibs-navy shadow-sm outline-none transition-all duration-150 placeholder:text-slate-400 hover:border-slate-400 focus:border-sibs-orange focus:bg-white focus:ring-2 focus:ring-sibs-orange/15 disabled:cursor-not-allowed disabled:border-sibs-border disabled:bg-sibs-canvas disabled:text-sibs-faint disabled:shadow-none disabled:hover:border-sibs-border disabled:focus:border-sibs-border disabled:focus:bg-sibs-canvas disabled:focus:ring-0 font-jakarta";

  const Container = type === "select" ? "div" : "label";

  return (
    <Container className={`block min-w-0 font-jakarta ${className}`}>
      <span className="mb-1 block sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-faint">
        {label} {required ? "*" : ""}
      </span>

      {type === "textarea" ? (
        <textarea
          rows={rows}
          disabled={disabled}
          value={value || ""}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          className={`${common} min-h-[70px] 2xl:min-h-[80px] resize-y px-2.5 py-2 2xl:px-3 2xl:py-2.5`}
        />
      ) : type === "autogrow" ? (
        <AutoGrowProfileTextarea
          label={label}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={common}
        />
      ) : type === "month" ? (
        <MonthYearPicker
          label={label}
          hideLabel
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder || "Select month and year"}
          buttonClassName="!border-slate-300 !bg-white !shadow-sm"
        />
      ) : type === "select" ? (
        <SelectDropdown
          label={label}
          hideLabel
          value={value || ""}
          onChange={(selectedValue) => onChange?.(selectedValue)}
          options={options}
          placeholder={placeholder || "Choose option"}
          disabled={disabled}
          buttonClassName="!border-slate-300 !bg-white !text-sibs-navy !shadow-sm hover:!border-slate-400 hover:!bg-white focus-visible:!border-sibs-orange focus-visible:!ring-2 focus-visible:!ring-sibs-orange/15"
        />
      ) : type === "phone11" ? (
        <input
          type="text"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={11}
          pattern="[0-9]{11}"
          title="Enter exactly 11 digits"
          aria-label={label}
          disabled={disabled}
          value={value || ""}
          onChange={(event) => {
            const digitsOnly = String(event.target.value || "")
              .replace(/\D/g, "")
              .slice(0, 11);
            onChange?.(digitsOnly);
          }}
          placeholder={placeholder || "09XXXXXXXXX"}
          className={`${common} h-8 2xl:h-9`}
        />
      ) : type === "date" || type === "formatted-date" ? (
        <DatePicker
          label={label}
          hideLabel
          value={value || ""}
          displayValue={type === "formatted-date" ? displayValue : undefined}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder || "Select date"}
          buttonClassName="!border-slate-300 !bg-white !shadow-sm"
        />
      ) : (
        <input
          type={type}
          disabled={disabled}
          value={value || ""}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          className={`${common} h-8 2xl:h-9`}
        />
      )}
    </Container>
  );
}
