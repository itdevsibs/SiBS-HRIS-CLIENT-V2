import { UsersRound } from "lucide-react";

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
  const totalRolesHandled = recruiters.reduce(
    (sum, r) => sum + (Number(r.activeRoles) || 0),
    0,
  );

  return (
    <aside
      className="sibs-page-card-in sibs-card font-jakarta flex h-full w-full flex-col justify-between rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm 2xl:p-6"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div>
        <h3 className="font-heading text-sm 2xl:text-base font-bold tracking-tight text-[#042C51]">
          Recruiter Load
        </h3>
        <p className="mt-1 text-xs font-semibold text-[#667085]">
          Active roles handled versus output parameters
        </p>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2.5 rounded-xl border border-[#DDE5EE] bg-[#F8FAFC] p-3 overflow-y-auto sibs-scrollbar">
        {recruiters.length === 0 ? (
          <div className="sibs-empty-panel rounded-xl border border-dashed border-[#D6E0EA] bg-white px-5 py-10 text-center text-xs font-bold text-[#667085]">
            No recruiter load records are available.
          </div>
        ) : (
          recruiters.map((row) => (
            <article
              key={row.name}
              className="rounded-lg border border-[#DDE5EE] bg-white p-3.5 shadow-2xs transition hover:border-[#FF5C28]/40 hover:shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="block truncate text-xs 2xl:text-sm font-extrabold text-[#042C51]">
                    {row.name}
                  </strong>
                  <p className="mt-0.5 sibs-text-micro font-semibold text-[#667085]">
                    {row.activeRoles} active roles handled
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded border px-2 py-0.5 sibs-text-micro font-extrabold uppercase tracking-wide ${getLoadClass(
                    row.loadStatus,
                  )}`}
                >
                  {row.loadStatus} Load
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-3 border-t border-[#EEF2F6] pt-2.5 text-center">
                {[
                  ["Sourced", row.output.sourced, "text-[#042C51]"],
                  ["Interviewed", row.output.interviewed, "text-[#042C51]"],
                  ["Hired", row.output.hired, "text-emerald-600"],
                ].map(([label, value, tone]) => (
                  <div key={label}>
                    <span className="block sibs-text-micro font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      {label}
                    </span>
                    <p className={`mt-0.5 text-xs 2xl:text-sm font-extrabold tabular-nums ${tone}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/70 px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[#042C51]">
            <UsersRound className="h-3.5 w-3.5 text-indigo-700" />
          </span>
          <div>
            <p className="sibs-text-micro font-extrabold uppercase tracking-wider text-indigo-900">
              Active TA Team
            </p>
            <p className="sibs-text-xs font-black text-[#042C51]">
              Total Capacity
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="font-heading block text-base 2xl:text-lg font-bold leading-none tabular-nums text-[#042C51]">
            {recruiters.length} Recruiters
          </span>
          <span className="mt-1 block sibs-text-micro font-bold text-indigo-700">
            {totalRolesHandled} active roles
          </span>
        </div>
      </div>
    </aside>
  );
}
