import { X } from "lucide-react";
// import {
//   inputClass,
//   textareaClass,
// } from "../../../lib/utils/offers/offerHelpers";
// import { declineCategoryOptions } from "../../../lib/utils/offers/offerConstants";

export default function DeclineResponseModal({
  open,
  offer,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !offer) return null;

  return (
    <div
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[10000] flex h-dvh items-center justify-center px-4 py-4 font-jakarta"
      onClick={onClose}
    >
      <div
        className="sibs-modal-pop-in w-full max-w-xl rounded-[14px] border border-sibs-border bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-sibs-border px-5 py-4">
          <div>
            <h2 className="sibs-modal-title truncate text-red-700">
              Candidate Declined Contract
            </h2>
            <p className="sibs-modal-subtitle mt-0.5 text-sibs-muted">
              {offer.candidateName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 items-center justify-center rounded-[10px] text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
              Decline Category <span className="text-sibs-orange"> *</span>
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
              Decline Reason <span className="text-sibs-orange"> *</span>
            </label>
          </div>
        </form>

        <div className="border-t border-sibs-border px-5 py-4">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-[10px] bg-red-600 px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
            >
              Save Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
