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
  subtitle = "SiBS HRIS",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  icon: CustomIcon = null,
  children = null,
  maxWidth = "max-w-md",
  closeOnEscape = false,
  // Optional notes slot for action confirmation workflows
  showNotes = false,
  notes = "",
  onNotesChange = null,
  notesPlaceholder = "Add notes for this action...",
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
      subtitle={subtitle}
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
      {showNotes ? (
        <label className="mt-3.5 block">
          <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
            Notes <span className="font-semibold normal-case">(Optional)</span>
          </span>
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => onNotesChange?.(event.target.value)}
            placeholder={notesPlaceholder}
            className="sibs-input min-h-20 w-full resize-none py-2.5"
          />
        </label>
      ) : null}
      {children}
    </StatusModal>
  );
}
