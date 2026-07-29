import { hasValue } from "../../../../lib/utils/employees/employeeProfileHelpers.js";

export function ProfileReadField({
  label,
  value,
  mono = false,
  className = "",
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 text-left ${className}`}>
      <span className="block text-[10px] font-bold uppercase tracking-wide text-[#8EA3BF]">
        {label}
      </span>
      <div className="flex min-h-[40px] items-center rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5 transition-colors duration-150">
        <span
          className={`block min-w-0 break-words text-xs font-semibold leading-normal ${
            hasValue(value) ? "text-[#101828]" : "text-[#98A2B3]"
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
  rows = 3,
  placeholder = "",
  className = "",
}) {
  const common =
    "w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#101828] outline-none transition-all duration-150 placeholder:text-[#98A2B3] hover:border-[#C9D6E4] focus:border-[#042C51] focus:bg-white focus:ring-2 focus:ring-[#042C51]/10";

  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#8EA3BF]">
        {label} {required ? "*" : ""}
      </span>

      {type === "textarea" ? (
        <textarea
          rows={rows}
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${common} min-h-[80px] resize-y px-3 py-2.5`}
        />
      ) : type === "select" ? (
        <select
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          className={`${common} h-10 cursor-pointer`}
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
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${common} h-10`}
        />
      )}
    </label>
  );
}
