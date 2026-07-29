import { FolderLock, ShieldCheck, X } from "lucide-react";

import { formatDisplayDate } from "../../../../../lib/utils/employees/employeeProfileHelpers.js";
import { getDocumentFileType } from "./documentPresentation.js";

export default function DocumentPreviewModal({ document, onClose }) {
  if (!document) return null;

  return (
    <div
      className="sibs-modal-backdrop-in fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="sibs-modal-pop-in w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#042C51] px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <FolderLock size={17} className="text-[#FF5C28]" />
            <h3 className="text-xs font-extrabold uppercase tracking-wide">
              Secure Document Preview
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-white/10"
            aria-label="Close document preview"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-start gap-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-xs font-extrabold text-red-600">
              {getDocumentFileType(document?.name)}
            </span>
            <div className="min-w-0">
              <h4 className="truncate text-sm font-extrabold text-[#042C51]">
                {document?.name}
              </h4>
              <span className="mt-2 inline-flex rounded-full bg-[#E9F0FC] px-2.5 py-1 text-[9px] font-extrabold text-[#042C51]">
                {document?.category}
              </span>
            </div>
          </div>

          <div className="divide-y divide-[#E6ECF2] text-xs">
            {[
              ["File Size", document?.fileSize],
              ["Uploaded Date", formatDisplayDate(document?.uploadedAt)],
              ["Uploaded By", document?.uploadedBy],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-3">
                <span className="font-semibold text-[#667085]">{label}</span>
                <span className="text-right font-extrabold text-[#344054]">
                  {value || "—"}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold leading-5 text-amber-800">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" />
            Downloads should be recorded by the backend audit trail when connected.
          </div>
        </div>
      </div>
    </div>
  );
}
