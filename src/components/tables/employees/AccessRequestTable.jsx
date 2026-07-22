import { Clock3, ShieldCheck } from "lucide-react";

const columns = [
  "Employee",
  "Requested Access",
  "Requested By",
  "Date Requested",
  "Status",
];

function EmptyMessage() {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2FB] text-[#042C51]">
        <ShieldCheck size={22} />
      </div>

      <h3 className="mt-3 text-sm font-extrabold text-[#042C51]">
        Access Requests module is ready for integration
      </h3>

      <p className="mt-1 max-w-xl text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
        No backend data source is connected to this component yet. The
        responsive presentation is ready for the existing request API and
        action handlers when they are added.
      </p>
    </div>
  );
}

export default function AccessRequestTable() {
  return (
    <div className="min-w-0 p-4 font-jakarta sm:p-5">
      <div className="lg:hidden">
        <article className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#FF5C28]">
              <Clock3 size={19} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#667085]">
                Access Requests
              </p>
              <h3 className="mt-1 break-words text-sm font-extrabold text-[#042C51]">
                No request records available
              </h3>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-[#667085]">
                No backend data source is connected to this component yet.
              </p>
            </div>
          </div>
        </article>
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] bg-white lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead className="bg-[#F8FAFC]">
              <tr className="border-b border-[#E6ECF2]">
                {columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#667085]"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        <EmptyMessage />
      </div>
    </div>
  );
}
