import React from "react";
import { AlertTriangle, CheckCircle, Info, Loader2, Trash2 } from "lucide-react";
import ModalShell from "./ModalShell";

const VARIANT_ICONS = {
  danger: {
    icon: Trash2,
    iconBg: "bg-rose-50 text-rose-600 border border-rose-100",
    buttonClass: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500/20",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50 text-amber-600 border border-amber-100",
    buttonClass: "bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500/20",
  },
  primary: {
    icon: Info,
    iconBg: "bg-blue-50 text-sibs-navy border border-blue-100",
    buttonClass: "sibs-btn-primary",
  },
  success: {
    icon: CheckCircle,
    iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    buttonClass: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500/20",
  },
};

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
}) {
  const config = VARIANT_ICONS[variant] || VARIANT_ICONS.danger;
  const IconComponent = CustomIcon || config.icon;

  return (
    <ModalShell
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={maxWidth}
      title={title}
      hideCloseButton={loading}
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="sibs-btn-secondary px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition shadow-xs disabled:cursor-not-allowed disabled:opacity-50 ${config.buttonClass}`}
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-3.5 p-4 sm:p-5 font-jakarta">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}
        >
          <IconComponent size={20} strokeWidth={2.2} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-semibold leading-relaxed text-sibs-muted">
            {description}
          </p>
          {children}
        </div>
      </div>
    </ModalShell>
  );
}
