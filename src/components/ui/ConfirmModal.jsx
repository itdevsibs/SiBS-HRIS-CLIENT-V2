import React from "react";
import { AlertTriangle, CheckCircle2, Info, Trash2 } from "lucide-react";
import StatusModal from "@/components/modals/StatusModal";

const VARIANT_ICONS = {
  danger: Trash2,
  warning: AlertTriangle,
  primary: Info,
  success: CheckCircle2,
};

/** Shared confirmation: same visual standard as all StatusModal dialogs. */
export default function ConfirmModal({
  open = false,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  icon: CustomIcon = null,
  children = null,
  maxWidth = "max-w-md",
  closeOnEscape = false,
  // Preserved public API; backdrop dismissal is intentionally disabled globally.
  closeOnBackdrop = false,
  mobileBottomSheet = false,
}) {
  void closeOnBackdrop;
  void mobileBottomSheet;
  return (
    <StatusModal
      open={open}
      type="confirm"
      subtitle="SiBS HRIS"
      title={title}
      message={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      icon={CustomIcon || VARIANT_ICONS[variant] || VARIANT_ICONS.danger}
      onClose={onClose}
      onCancel={onClose}
      onConfirm={onConfirm}
      loading={loading}
      maxWidth={maxWidth}
      closeOnEscape={closeOnEscape}
    >
      {children}
    </StatusModal>
  );
}
