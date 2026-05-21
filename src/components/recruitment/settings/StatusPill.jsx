import React from "react";

export default function StatusPill({ active, children }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${
        active
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-red-100 bg-red-50 text-red-600"
      }`}
    >
      {children}
    </span>
  );
}
