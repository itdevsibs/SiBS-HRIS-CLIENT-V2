import React from "react";
import { AlertCircle } from "lucide-react";
import ModalShell from "../../ui/ModalShell";

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
    <ModalShell
      open={Boolean(open && offer)}
      onClose={onClose}
      variant="navy"
      title="Candidate Declined Contract"
      subtitle={offer.candidateName}
      icon={AlertCircle}
      maxWidth="max-w-xl"
      className="rounded-[14px]"
      bodyClassName="space-y-4 p-5 font-jakarta"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-slate-600 transition hover:bg-slate-50"
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
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
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
    </ModalShell>
  );
}
