import React from "react";

function DonutChart({ data = [] }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  let current = 0;

  const gradient =
    total > 0
      ? data
          .map((item) => {
            const start = current;
            const size = (Number(item.value || 0) / total) * 100;
            current += size;
            return `${item.color} ${start}% ${current}%`;
          })
          .join(", ")
      : "#E6ECF2 0% 100%";

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-center">
      <div
        className="relative h-32 w-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <div className="absolute inset-7 rounded-full bg-white" />
      </div>

      <div className="w-full max-w-md space-y-3">
        {data.length > 0 ? (
          data.map((item) => {
            const percent =
              total > 0
                ? Math.round((Number(item.value || 0) / total) * 100)
                : 0;

            return (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />

                  <span className="truncate font-semibold text-[#344054]">
                    {item.label}
                  </span>
                </div>

                <span className="shrink-0 font-bold text-[#101828]">
                  {item.value} ({percent}%)
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-center text-sm font-bold text-gray-500">
            No reason data available.
          </p>
        )}
      </div>
    </div>
  );
}

export default function ReasonForHiringTable({ data = [] }) {
  return (
    <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-bold text-[#101828]">
        Requisition by Reason for Hiring
      </h2>

      <div className="mt-4 rounded-xl bg-white">
        <DonutChart data={data} />
      </div>
    </section>
  );
}