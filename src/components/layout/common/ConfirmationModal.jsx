import React, { useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";

/**
 * Compatibility wrapper delegating to canonical ConfirmModal.
 * Preserves useConfirmDialog() hook for candidate pipeline and position workflows.
 */
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
  variant = "warning",
}) {
  return (
    <ConfirmModal
      open={open}
      title={title}
      description={message}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onClose={onCancel}
      onConfirm={onConfirm}
      showNotes={showNotes}
      notes={notes}
      onNotesChange={onNotesChange}
      variant={variant}
    />
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
