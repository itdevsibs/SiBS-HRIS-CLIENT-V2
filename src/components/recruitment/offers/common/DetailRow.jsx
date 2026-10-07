export default function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-sibs-border py-2 2xl:py-2.5 font-jakarta last:border-b-0">
      <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
        {label}
      </p>

      <div className="max-w-[62%] break-words text-right sibs-text-micro 2xl:sibs-text-xs font-extrabold text-sibs-navy">
        {value || "—"}
      </div>
    </div>
  );
}
