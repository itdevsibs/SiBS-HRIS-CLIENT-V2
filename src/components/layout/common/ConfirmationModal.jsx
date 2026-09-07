import React, { useState } from "react";

function ConfirmationModal({
  open,
  title = "Confirm Action",
  message,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[12000] flex h-dvh items-center justify-center px-4 py-4 font-jakarta"
      onClick={onCancel}
    >
      <div
        className="sibs-modal-pop-in w-full max-w-md overflow-hidden rounded-2xl border border-[#D7DEE8] bg-white font-jakarta shadow-[0_20px_45px_rgba(4,44,81,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#E6ECF2] bg-white px-5 py-4">
          <h3 className="sibs-modal-title text-[#042C51]">
            {title}
          </h3>

          {message && (
            <p className="sibs-modal-subtitle mt-1 text-[#667085]">
              {message}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 min-w-[88px] items-center justify-center rounded-lg border border-[#D6E0EA] bg-white px-4 font-jakarta sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] focus:outline-none focus:ring-4 focus:ring-[#FF5C28]/15 active:translate-y-px"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-10 min-w-[104px] items-center justify-center rounded-lg bg-[#FF5C28] px-4 font-jakarta sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] focus:outline-none focus:ring-4 focus:ring-[#FF5C28]/20 active:translate-y-px"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirmDialog() {
  const [confirmState, setConfirmState] = useState(null);

  function confirmAction(message, options = {}) {
    return new Promise((resolve) => {
      setConfirmState({
        message,
        title: options.title || "Confirm Action",
        confirmLabel: options.confirmLabel || options.confirmText || "Continue",
        cancelLabel: options.cancelLabel || "Cancel",
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
      confirmLabel={confirmState?.confirmLabel}
      cancelLabel={confirmState?.cancelLabel}
      onCancel={() => closeConfirm(false)}
      onConfirm={() => closeConfirm(true)}
    />
  );

  return {
    confirmAction,
    ConfirmationDialog,
  };
}

export default ConfirmationModal;
