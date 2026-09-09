import { FolderLock, ShieldCheck, X } from "lucide-react";

import { formatDisplayDate } from "../../../../../lib/utils/employees/employeeProfileHelpers.js";
import { getDocumentFileType } from "./documentPresentation.js";

export default function DocumentPreviewModal({ document, onClose }) {
  if (!document) return null;

  return (
    <div
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[99999] flex items-center justify-center p-2 font-jakarta sm:p-4"
      onClick={onClose}
    >
      <div
        className="sibs-modal-pop-in flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl font-jakarta"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
            <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
              <FolderLock size={16} />
            </span>
            <div className="min-w-0">
              <h3 className="sibs-modal-title truncate text-white">
                Secure Document Preview
              </h3>
              <p className="sibs-modal-subtitle mt-0.5 truncate text-white/75">
                Employee Personnel File
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close document preview"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto space-y-4 p-4 sm:p-5 2xl:p-6 sibs-scrollbar">
          <div className="flex items-start gap-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3.5 2xl:p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xs font-extrabold text-red-600">
              {getDocumentFileType(document?.name)}
            </span>
            <div className="min-w-0">
              <h4 className="sibs-modal-section-title truncate text-[#042C51]">
                {document?.name}
              </h4>
              <span className="mt-1.5 inline-flex rounded-full bg-[#E9F0FC] px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#042C51]">
                {document?.category}
              </span>
            </div>
          </div>

          <div className="divide-y divide-[#E6ECF2] sibs-text-xs">
            {[
              ["File Size", document?.fileSize],
              ["Uploaded Date", formatDisplayDate(document?.uploadedAt)],
              ["Uploaded By", document?.uploadedBy],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2.5 2xl:py-3">
                <span className="font-semibold text-[#667085]">{label}</span>
                <span className="text-right font-extrabold text-[#344054]">
                  {value || "—"}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 sibs-text-xs font-semibold leading-relaxed text-amber-800">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" />
            Downloads are recorded in the HRIS security audit trail.
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-end border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 2xl:py-3.5 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#667085] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
