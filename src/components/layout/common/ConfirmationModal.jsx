import React, { useState } from "react";
import StatusModal from "@/components/modals/StatusModal";

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
  return (
    <StatusModal
      open={open}
      type="confirm"
      subtitle="SiBS HRIS"
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onCancel={onCancel}
      onClose={onCancel}
      onConfirm={onConfirm}
    >
      {showNotes ? (
        <label className="mt-3.5 block">
          <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
            Notes <span className="font-semibold normal-case">(Optional)</span>
          </span>
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => onNotesChange?.(event.target.value)}
            placeholder="Add notes for this action..."
            className="sibs-input min-h-20 w-full resize-none py-2.5"
          />
        </label>
      ) : null}
    </StatusModal>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
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
