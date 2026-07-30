function getLoadClass(status) {
  if (status === "High") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "Medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default function TARecruiterLoad({ recruiters = [], delay = 0 }) {
  return (
    <aside
      className="sibs-page-card-in sibs-card flex h-full w-full flex-col p-5 sm:p-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="sibs-section-title">Recruiter Load</h2>
      <p className="sibs-section-subtitle">
        Active roles handled versus output parameters
      </p>

      <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {recruiters.length === 0 ? (
          <div className="sibs-empty-panel">
            No recruiter load records are available.
          </div>
        ) : (
          recruiters.map((row) => (
            <article
              key={row.name}
              className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 transition hover:border-[#FF5C28]/30 hover:bg-white hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="break-words text-sm text-[#042C51]">
                    {row.name}
                  </strong>
                  <p className="mt-1 text-[11px] text-[#667085]">
                    {row.activeRoles} active roles handled
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded border px-2 py-1 text-[9px] font-extrabold uppercase tracking-normal ${getLoadClass(
                    row.loadStatus,
                  )}`}
                >
                  {row.loadStatus} Load
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 border-t border-[#E6ECF2] pt-3 text-center">
                {[
                  ["Sourced", row.output.sourced, "text-[#042C51]"],
                  ["Interviewed", row.output.interviewed, "text-[#042C51]"],
                  ["Hired", row.output.hired, "text-emerald-600"],
                ].map(([label, value, tone]) => (
                  <div key={label}>
                    <span className="text-[8px] font-extrabold uppercase text-[#98A2B3]">
                      {label}
                    </span>
                    <p className={`text-sm font-extrabold tabular-nums ${tone}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}
