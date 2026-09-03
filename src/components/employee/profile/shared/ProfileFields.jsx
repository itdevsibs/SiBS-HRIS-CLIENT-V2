import { hasValue } from "../../../../lib/utils/employees/employeeProfileHelpers.js";

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
    "w-full rounded-xl border border-sibs-border bg-sibs-surface px-2.5 2xl:px-3 sibs-text-xs 2xl:sibs-text-sm font-semibold text-sibs-secondary outline-none transition-all duration-150 placeholder:text-sibs-faint hover:border-sibs-border-subtle focus:border-sibs-navy focus:bg-white focus:ring-2 focus:ring-sibs-navy/10 disabled:cursor-not-allowed disabled:border-sibs-border disabled:bg-[#EEF2F6] disabled:text-sibs-faint disabled:hover:border-sibs-border disabled:focus:border-sibs-border disabled:focus:bg-[#EEF2F6] disabled:focus:ring-0 font-jakarta";

  return (
    <label className={`block min-w-0 font-jakarta ${className}`}>
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
      ) : type === "select" ? (
        <select
          disabled={disabled}
          value={value || ""}
          onChange={(event) => onChange?.(event.target.value)}
          className={`${common} h-8 2xl:h-9 cursor-pointer`}
        >
          <option value="">Choose option</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
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
    </label>
  );
}
