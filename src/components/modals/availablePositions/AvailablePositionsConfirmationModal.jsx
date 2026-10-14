import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

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
    <ConfirmModal
      open={Boolean(open)}
      variant="warning"
      icon={AlertTriangle}
      title={title}
      description={
        message ||
        "Confirm this Available Position action. Status changes affect applicant-facing availability. Review the requested action before continuing."
      }
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      loading={isSaving}
      onClose={onCancel}
      onConfirm={onConfirm}
    />
  );
}

export function useConfirmDialog() {
  const [confirmState, setConfirmState] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  function confirmAction(message, options = {}) {
  function confirmAction(message, options = {}) {
    return new Promise((resolve) => {
      setConfirmState({
        message,
        title: options.title || "Confirm Action",
        confirmLabel: options.confirmLabel || options.confirmText || "Continue",
        cancelLabel: options.cancelLabel || "Cancel",
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
    <AvailablePositionsConfirmationModal
      open={Boolean(confirmState)}
      title={confirmState?.title}
      message={confirmState?.message}
      confirmLabel={confirmState?.confirmLabel}
      cancelLabel={confirmState?.cancelLabel}
      onCancel={() => closeConfirm(false)}
      onConfirm={() => closeConfirm(true)}
      confirmLabel={confirmState?.confirmLabel}
      cancelLabel={confirmState?.cancelLabel}
      onCancel={() => closeConfirm(false)}
      onConfirm={() => closeConfirm(true)}
    />
  );

  return { confirmAction, ConfirmationDialog };
}

export default AvailablePositionsConfirmationModal;
