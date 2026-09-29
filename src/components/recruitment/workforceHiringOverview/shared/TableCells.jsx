export function DetailTh({ children, className = "", ...props }) {
  return (
    <th
      {...props}
      className={`sibs-data-table-th border border-sibs-border bg-blue-50 px-2 py-3 text-center align-middle text-[10px] font-extrabold uppercase leading-tight text-sibs-navy ${className}`}
    >
      {children}
    </th>
  );
}

export function DetailTd({ children, className = "" }) {
  return (
    <td
      className={`border border-sibs-border bg-inherit px-2 py-2.5 text-center align-middle text-[11px] font-semibold leading-tight text-slate-700 ${className}`}
    >
      {children}
    </td>
  );
}

export function SmallTh({ children, className = "" }) {
  return (
    <th
      className={`border-b border-sibs-border bg-blue-50 px-2.5 py-1.5 text-center text-[9px] font-extrabold uppercase tracking-wide text-sibs-navy ${className}`}
    >
      {children}
    </th>
  );
}

export function SmallTd({ children, className = "" }) {
  return (
    <td
      className={`border-b border-sibs-border px-2.5 py-1.5 text-center text-[10px] font-semibold text-slate-700 ${className}`}
    >
      {children}
    </td>
  );
}
