import React, { useEffect, useState } from "react";

function ConfirmationModal({
  open,
  title = "Confirm Action",
  message,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  onCancel,
  onConfirm,
  showNotes = false,
  notes = "",
  onNotesChange,
}) {
  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[12000] flex h-dvh touch-none overscroll-contain items-center justify-center px-4 py-4 font-jakarta"
      role="presentation"
    >
      <div
        className="sibs-modal-pop-in w-full max-w-md overflow-hidden rounded-2xl border border-[#D7DEE8] bg-white font-jakarta shadow-[0_20px_45px_rgba(4,44,81,0.18)]"
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

        {showNotes && (
          <div className="border-b border-[#E6ECF2] px-5 py-4">
            <label className="block">
              <span className="mb-1.5 block text-[9px] font-extrabold uppercase tracking-wide text-[#667085]">
                Notes <span className="font-semibold normal-case tracking-normal text-[#98A2B3]">(Optional)</span>
              </span>
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => onNotesChange?.(event.target.value)}
                placeholder="Add notes for this action..."
                className="w-full resize-none rounded-xl border border-[#D7DEE8] bg-white px-3 py-2.5 text-[12px] font-medium text-[#344054] outline-none transition focus:border-[#FF5C28] focus:ring-2 focus:ring-[#FF5C28]/10"
              />
            </label>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="sibs-modal-btn-secondary min-w-[88px]"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="sibs-modal-btn-primary min-w-[104px]"
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
  const [notes, setNotes] = useState("");

  function confirmAction(message, options = {}) {
    setNotes(options.notes || "");
    return new Promise((resolve) => {
      setConfirmState({
        message,
        title: options.title || "Confirm Action",
        confirmLabel: options.confirmLabel || options.confirmText || "Continue",
        cancelLabel: options.cancelLabel || "Cancel",
        showNotes: options.showNotes !== false,
        resolve,
      });
    });
  }

  function closeConfirm(result) {
    if (confirmState?.resolve) {
      confirmState.resolve(result ? { confirmed: true, notes: notes.trim() } : { confirmed: false, notes: "" });
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
      showNotes={confirmState?.showNotes}
      notes={notes}
      onNotesChange={setNotes}
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
