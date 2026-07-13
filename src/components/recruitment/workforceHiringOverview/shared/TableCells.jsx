export function DetailTh({ children, className = "", ...props }) {
  return (
    <th
      {...props}
      className={`border border-sibs-primary-60 bg-sibs-primary-90 px-1.5 py-3 text-center text-[10px] font-bold leading-tight text-white ${className}`}
    >
      {children}
    </th>
  );
}

export function DetailTd({ children, className = "" }) {
  return (
    <td
      className={`border border-slate-200 bg-inherit px-1.5 py-3 text-center text-[11px] font-medium text-slate-900 ${className}`}
    >
      {children}
    </td>
  );
}

export function SmallTh({ children, className = "" }) {
  return (
    <th
      className={`px-1.5 py-2 text-center text-[10px] font-bold text-slate-700 ${className}`}
    >
      {children}
    </th>
  );
}

export function SmallTd({ children, className = "" }) {
  return (
    <td
      className={`border-t border-slate-200 px-1.5 py-2.5 text-center text-[11px] font-medium text-slate-700 ${className}`}
    >
      {children}
    </td>
  );
}
