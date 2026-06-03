export default function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="max-w-[62%] break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}
