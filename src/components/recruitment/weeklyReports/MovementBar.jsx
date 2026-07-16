export default function MovementBar({ label, value, max, delay = 0 }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="sibs-page-card-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="min-w-0 truncate text-sm font-bold text-[#344054]">
          {label}
        </p>

        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">
          {value}
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-sibs-primary-1 transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
