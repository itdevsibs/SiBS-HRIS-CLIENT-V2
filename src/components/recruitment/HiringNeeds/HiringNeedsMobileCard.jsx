import React from "react";

function getStatusClass(status) {
  switch (status) {
    case "Approved": return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Not Approved": return "border-red-200 bg-red-50 text-red-700";
    case "For Approval": return "border-amber-200 bg-amber-50 text-amber-700";
    default: return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

export default function HiringNeedsMobileCard({ item, onView }) {
  return (
    <button
      type="button"
      onClick={() => onView(item)}
      className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">{item.id}</p>
          <h3 className="mt-1 text-sm font-bold text-[#101828] truncate">
            {item.positionTitle}
          </h3>
          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5 truncate">
            {item.departmentAccount}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(item.approvalStatus)}`}>
          {item.approvalStatus}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">Headcount</p>
          <p className="mt-1 text-xs font-extrabold text-sibs-primary-1">{item.headcount}</p>
        </div>
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">Location</p>
          <p className="mt-1 text-xs font-bold text-[#344054] truncate">{item.locationSite}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
         <p className="text-[11px] font-bold text-sibs-tertiary-5 italic">
           Reason: {item.reasonForHiring}
         </p>
      </div>
    </button>
  );
}