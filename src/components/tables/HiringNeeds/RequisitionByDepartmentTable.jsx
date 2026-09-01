import React, { useMemo } from "react";

function cleanText(value) {
  return String(value ?? "").trim();
}

function getNumericValue(item = {}) {
  const value =
    item.value ??
    item.count ??
    item.headcount ??
    item.total ??
    item.totalHeadcount ??
    item.total_headcount ??
    0;

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizeDepartmentRows(data) {
  if (Array.isArray(data)) {
    return data
      .map((item, index) => {
        if (typeof item === "string") {
          return {
            id: `${item}-${index}`,
            label: item,
            value: 0,
          };
        }

        const label =
          cleanText(
            item.label ||
              item.department ||
              item.name ||
              item.departmentName ||
              item.department_name,
          ) || `Department ${index + 1}`;

        return {
          id: item.id || `${label}-${index}`,
          label,
          value: getNumericValue(item),
        };
      })
      .filter((item) => item.label);
  }

  if (data && typeof data === "object") {
    return Object.entries(data).map(([label, value], index) => ({
      id: `${label}-${index}`,
      label,
      value: Number.isFinite(Number(value)) ? Number(value) : 0,
    }));
  }

  return [];
}

export default function RequisitionByDepartmentTable({
  data = [],
  delay = 0,
}) {
  const rows = useMemo(
    () => normalizeDepartmentRows(data),
    [data],
  );

  const maximumValue = useMemo(() => {
    return Math.max(
      ...rows.map((item) => Number(item.value || 0)),
      1,
    );
  }, [rows]);

  return (
    <section
      className="sibs-page-card-in sibs-card flex min-h-full flex-col rounded-2xl border border-[#E6ECF2] bg-white p-3.5 2xl:p-4 font-jakarta shadow-sm"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div>
        <h3 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
          Requisition by Department
        </h3>

        <p className="mt-0.5 sibs-text-xs font-semibold text-[#667085]">
          Active approved and pending request quota
        </p>
      </div>

      <div className="mt-3 2xl:mt-4 flex-1 space-y-2.5 2xl:space-y-3">
        {rows.length > 0 ? (
          rows.map((item) => {
            const percentage =
              item.value > 0
                ? Math.max(
                    5,
                    Math.min(
                      (item.value / maximumValue) * 100,
                      100,
                    ),
                  )
                : 0;

            return (
              <div key={item.id}>
                <div className="mb-1.5 flex items-center justify-between gap-4">
                  <p
                    className="min-w-0 truncate text-xs font-extrabold text-[#344054]"
                    title={item.label}
                  >
                    {item.label}
                  </p>

                  <p className="shrink-0 text-xs font-extrabold tabular-nums text-[#5B3DF5]">
                    {item.value.toLocaleString("en-PH")}{" "}
                    {item.value === 1 ? "slot" : "slots"}
                  </p>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F6]">
                  <div
                    className="h-full rounded-full bg-[#042C51] transition-[width] duration-500 ease-out"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex min-h-36 items-center justify-center rounded-[10px] border border-dashed border-[#D7DEE8] bg-[#F8FAFC] px-4 text-center">
            <p className="text-xs font-semibold text-[#98A2B3]">
              No department data available.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
