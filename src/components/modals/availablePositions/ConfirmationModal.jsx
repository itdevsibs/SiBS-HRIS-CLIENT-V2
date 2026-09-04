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
      className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[12000] flex h-dvh items-center justify-center p-3 sm:p-4 font-jakarta bg-[#042C51]/60"
      onClick={() => {
        if (!isSaving) onCancel?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="available-position-confirm-title"
        className="sibs-modal-pop-in w-full max-w-md overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl font-jakarta"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <header className="bg-[#042C51] px-4 py-3 text-white sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5 2xl:gap-3">
              <span className="flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#FF5C28]">
                <AlertTriangle className="h-4 w-4 text-[#FF5C28]" />
              </span>

              <div className="min-w-0">
                <p className="sibs-modal-subtitle text-white/75 truncate sm:text-clip">
                  Position Dictionary
                </p>

                <h3
                  id="available-position-confirm-title"
                  className="sibs-modal-title mt-0.5 truncate text-white"
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
              className="sibs-modal-close-btn"
              title="Close"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-5">
          <p className="text-xs font-semibold leading-relaxed text-[#667085]">
            {message ||
              "Confirm this Available Position action."}
          </p>

          <div className="mt-3.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[10px] font-semibold leading-relaxed text-amber-800">
            Status changes affect applicant-facing
            availability. Review the requested action
            before continuing.
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 sm:flex-row sm:justify-end sm:gap-2.5 sm:px-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-4 sibs-text-xs font-extrabold text-[#042C51] transition hover:bg-[#F2F6FA] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E95324] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
          >
            {isSaving ? (
              <Loader2
                size={13}
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
