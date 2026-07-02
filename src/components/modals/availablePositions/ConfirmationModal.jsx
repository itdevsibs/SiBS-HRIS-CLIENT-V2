import { Loader2 } from "lucide-react";
import React from "react";

const ConfirmationModal = ({
  open,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
  isSaving = false,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[12000] flex h-dvh items-center justify-center bg-slate-950/40 px-4 py-4 backdrop-blur-[1px]"
      onClick={isSaving ? undefined : onCancel}
    >
      <div
        className="sibs-profile-tab-panel w-full max-w-md overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#EEF2F6] px-5 py-4">
          <h3 className="text-base font-extrabold text-sibs-primary-1">
            {title}
          </h3>

          <p className="mt-1 text-sm font-semibold leading-6 text-[#667085]">
            {message}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D9E2EC] bg-white px-5 text-sm font-bold text-[#344054] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B8C4D2] hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? "Saving..." : confirmLabel || "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
