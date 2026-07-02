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
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusTone(
        status,
      )}`}
    >
      {status || "—"}
    </span>
  );
}
