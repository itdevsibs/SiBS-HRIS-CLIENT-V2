import React, { useState } from "react";
import {
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";

function ConfirmationModal({
  open,
  title = "Confirm Action",
  message,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  isSaving = false,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div
      className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[12000] flex h-dvh items-center justify-center p-4 font-jakarta"
      onClick={() => {
        if (!isSaving) onCancel?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="available-position-confirm-title"
        className="sibs-modal-pop-in w-full max-w-md overflow-hidden rounded-2xl border border-[#9FB3C8] bg-white shadow-[0_30px_90px_rgba(2,26,48,0.42)]"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <header className="bg-[#07365F] px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/15 bg-white/10 text-[#FF5C28]">
                <AlertTriangle size={17} />
              </span>

              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-wide text-blue-100">
                  Position Dictionary
                </p>

                <h3
                  id="available-position-confirm-title"
                  className="mt-0.5 text-base font-extrabold text-white"
                >
                  {title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              aria-label="Close confirmation"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-blue-100 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="px-5 py-5">
          <p className="text-xs font-semibold leading-6 text-[#667085]">
            {message ||
              "Confirm this Available Position action."}
          </p>

          <div className="mt-4 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[10px] font-semibold leading-5 text-amber-700">
            Status changes affect applicant-facing
            availability. Review the requested action
            before continuing.
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-[#E6ECF2] bg-[#F8FAFC] px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[#D7DEE8] bg-white px-4 text-xs font-extrabold text-[#042C51] transition hover:bg-[#F2F6FA] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E95324] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : null}

            {isSaving
              ? "Processing..."
              : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}

export function useConfirmDialog() {
  const [confirmState, setConfirmState] =
    useState(null);

  function confirmAction(
    message,
    options = {},
  ) {
    return new Promise((resolve) => {
      setConfirmState({
        message,
        title:
          options.title ||
          "Confirm Action",
        confirmLabel:
          options.confirmLabel ||
          options.confirmText ||
          "Continue",
        cancelLabel:
          options.cancelLabel ||
          "Cancel",
        resolve,
      });
    });
  }

  function closeConfirm(result) {
    if (confirmState?.resolve) {
      confirmState.resolve(result);
    }

    setConfirmState(null);
  }

  const ConfirmationDialog = (
    <ConfirmationModal
      open={Boolean(confirmState)}
      title={confirmState?.title}
      message={confirmState?.message}
      confirmLabel={
        confirmState?.confirmLabel
      }
      cancelLabel={
        confirmState?.cancelLabel
      }
      onCancel={() =>
        closeConfirm(false)
      }
      onConfirm={() =>
        closeConfirm(true)
      }
    />
  );

  return {
    confirmAction,
    ConfirmationDialog,
  };
}

export default ConfirmationModal;
