import { getStatusTone } from "../availablePositionsHelpers";

export function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex h-7 min-w-[82px] items-center justify-center whitespace-nowrap rounded-full border px-2 text-center text-[9.5px] font-extrabold leading-none ${getStatusTone(
        status,
      )}`}
    >
      {status || "—"}
    </span>
  );
}
