export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  valueClassName = "text-sibs-navy",
}) {
  return (
    <div className="rounded-[10px] border border-sibs-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-sibs-muted">
            {title}
          </p>

          <p
            className={`mt-3 truncate text-3xl font-extrabold ${valueClassName}`}
          >
            {value}
          </p>

          {description && (
            <p className="mt-1 truncate text-xs font-semibold text-sibs-muted">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-sky-50 text-sibs-navy">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
