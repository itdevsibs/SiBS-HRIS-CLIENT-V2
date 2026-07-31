export function DetailTh({ children, className = "", ...props }) {
  return (
    <th
      {...props}
      className={`sibs-data-table-th border border-[#D6E0EA] bg-[#E9F0FC] px-2 py-3 text-center align-middle text-[10px] font-extrabold uppercase leading-tight text-[#042C51] ${className}`}
    >
      {children}
    </th>
  );
}

export function DetailTd({ children, className = "" }) {
  return (
    <td
      className={`border border-[#E6ECF2] bg-inherit px-2 py-2.5 text-center align-middle text-[11px] font-semibold leading-tight text-[#344054] ${className}`}
    >
      {children}
    </td>
  );
}

export function SmallTh({ children, className = "" }) {
  return (
    <th
      className={`border-b border-[#D6E0EA] bg-[#E9F0FC] px-2.5 py-1.5 text-center text-[9px] font-extrabold uppercase tracking-wide text-[#042C51] ${className}`}
    >
      {children}
    </th>
  );
}

export function SmallTd({ children, className = "" }) {
  return (
    <td
      className={`border-b border-[#E6ECF2] px-2.5 py-1.5 text-center text-[10px] font-semibold text-[#344054] ${className}`}
    >
      {children}
    </td>
  );
}
