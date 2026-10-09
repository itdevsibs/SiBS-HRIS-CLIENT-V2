import React from "react";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { ModalShell } from "@/components/ui";

export default function StatusModal({
  open,
  type = "success",
  title,
  message,
  onClose,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmTone = "danger",
  variant = "center", // center | compact
  lockScroll = true,
}) {
  const isSuccess = type === "success";
  const isConfirm = type === "confirm";
  const isLoading = type === "loading";

  const finalTitle =
    title ||
    (isLoading
      ? "Saving Changes"
      : isConfirm
        ? "Confirm Action"
        : isSuccess
          ? "Success"
          : "Something went wrong");

  const finalMessage =
    message ||
    (isLoading
      ? "Please wait while your changes are being saved."
      : isConfirm
        ? "Are you sure you want to continue?"
        : "Operation completed.");

  const handleClose = () => {
    if (isLoading) return;

    if (isConfirm) {
      if (typeof onCancel === "function") {
        onCancel();
      } else {
        onClose?.();
      }
    } else {
      onClose?.();
    }
  };

  const iconComponent = isConfirm ? (
    <AlertTriangle size={variant === "compact" ? 22 : 26} />
  ) : isLoading ? (
    <Loader2 size={variant === "compact" ? 22 : 26} className="animate-spin" />
  ) : isSuccess ? (
    <CheckCircle2 size={variant === "compact" ? 22 : 26} />
  ) : (
    <XCircle size={variant === "compact" ? 22 : 26} />
  );

  const iconContainerClass = isConfirm
    ? "bg-amber-50 text-amber-600"
    : isLoading
      ? "bg-blue-50 text-sibs-navy"
      : isSuccess
        ? "bg-emerald-50 text-emerald-600"
        : "bg-rose-50 text-rose-600";

  const confirmBtnClass =
    confirmTone === "brand" ? "sibs-btn-primary" : "sibs-btn-danger";

  return (
    <ModalShell
      open={Boolean(open)}
      onClose={handleClose}
      variant="white"
      hideCloseButton
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
      lockScroll={lockScroll}
      maxWidth="max-w-md"
      bodyClassName="p-4 sm:p-5 font-jakarta"
      footer={
        !isLoading ? (
          variant === "compact" ? (
            <div className="flex items-center justify-end gap-2.5">
              {isConfirm && (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof onCancel === "function") {
                      onCancel();
                    } else {
                      onClose?.();
                    }
                  }}
                  className="sibs-btn-secondary"
                >
                  {cancelLabel}
                </button>
              )}
              <button
                type="button"
                onClick={isConfirm ? () => onConfirm?.() : handleClose}
                className={isConfirm ? confirmBtnClass : "sibs-btn-primary"}
              >
                {isConfirm ? confirmLabel : "OK"}
              </button>
            </div>
          ) : (
            <div className="flex w-full items-center gap-2.5">
              {isConfirm && (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof onCancel === "function") {
                      onCancel();
                    } else {
                      onClose?.();
                    }
                  }}
                  className="sibs-btn-secondary flex-1"
                >
                  {cancelLabel}
                </button>
              )}
              <button
                type="button"
                onClick={isConfirm ? () => onConfirm?.() : handleClose}
                className={`flex-1 ${
                  isConfirm ? confirmBtnClass : "sibs-btn-primary"
                }`}
              >
                {isConfirm ? confirmLabel : "OK"}
              </button>
            </div>
          )
        ) : null
      }
    >
      {variant === "compact" ? (
        <div className="flex items-start gap-3.5 sm:gap-4 font-jakarta">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconContainerClass}`}
          >
            {iconComponent}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="sibs-modal-title break-words">{finalTitle}</h3>
            <p className="sibs-modal-subtitle mt-1.5 whitespace-pre-line text-sibs-muted">
              {finalMessage}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center font-jakarta">
          <div
            className={`mb-3.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${iconContainerClass}`}
          >
            {iconComponent}
          </div>
          <h2 className="sibs-modal-title">{finalTitle}</h2>
          <p className="sibs-modal-subtitle mt-2 whitespace-pre-line text-sibs-muted">
            {finalMessage}
          </p>
        </div>
      )}
    </ModalShell>
  );
}
