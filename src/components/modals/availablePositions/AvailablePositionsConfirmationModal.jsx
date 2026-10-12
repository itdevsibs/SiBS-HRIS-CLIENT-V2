import React, { useState } from "react";
import StatusModal from "@/components/modals/StatusModal";

function AvailablePositionsConfirmationModal({
  open,
  title = "Confirm Action",
  message,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  isSaving = false,
  onCancel,
  onConfirm,
}) {
  return (
    <StatusModal
      open={open}
      type="confirm"
      subtitle="Position Dictionary"
      title={title}
      message={message || "Confirm this Available Position action."}
      notice="Status changes affect applicant-facing availability. Review the requested action before continuing."
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onCancel={onCancel}
      onClose={onCancel}
      onConfirm={onConfirm}
      loading={isSaving}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
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
    if (confirmState?.resolve) confirmState.resolve(result);
    setConfirmState(null);
  }

  const ConfirmationDialog = (
    <AvailablePositionsConfirmationModal
      open={Boolean(confirmState)}
      title={confirmState?.title}
      message={confirmState?.message}
      confirmLabel={confirmState?.confirmLabel}
      cancelLabel={confirmState?.cancelLabel}
      onCancel={() => closeConfirm(false)}
      onConfirm={() => closeConfirm(true)}
    />
  );

  return { confirmAction, ConfirmationDialog };
}

export default AvailablePositionsConfirmationModal;
