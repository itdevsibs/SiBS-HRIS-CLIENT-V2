import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";

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
  lockScroll = false,
}) {
  const mounted = typeof document !== "undefined";

  const previousOverflowRef = useRef({
    body: "",
    html: "",
  });

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (type === "loading") {
          return;
        }

        if (type === "confirm") {
          onCancel?.();
        } else {
          onClose?.();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);

    if (lockScroll) {
      previousOverflowRef.current = {
        body: document.body.style.overflow,
        html: document.documentElement.style.overflow,
      };

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);

      if (lockScroll) {
        document.body.style.overflow = previousOverflowRef.current.body || "";
        document.documentElement.style.overflow =
          previousOverflowRef.current.html || "";
      }
    };
  }, [open, onClose, onCancel, lockScroll, type]);

  if (!mounted || !open || typeof document === "undefined") return null;

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
      onCancel?.();
    } else {
      onClose?.();
    }

    if (!lockScroll && typeof document !== "undefined") {
      window.setTimeout(() => {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }, 0);
    }
  };

  return createPortal(
    <div
      className="sibs-modal-blur sibs-modal-backdrop-in fixed left-0 top-0 z-[999999] flex h-[100dvh] w-[100dvw] items-center justify-center px-4 font-jakarta"
      onClick={handleClose}
    >
      {variant === "compact" ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className="sibs-modal-pop-in w-full max-w-md rounded-2xl border border-[#D7DEE8] bg-white p-6 shadow-2xl font-jakarta"
        >
          <div className="mb-4 flex items-start gap-4">
            <div className="flex min-w-0 flex-row items-center gap-3">
              <div
                className={`shrink-0 rounded-2xl p-3 ${
                  isConfirm
                    ? "bg-amber-50 text-amber-500"
                    : isLoading
                      ? "bg-[#EFF6FF] text-sibs-primary-1"
                    : isSuccess
                      ? "bg-emerald-50 text-emerald-500"
                      : "bg-red-50 text-red-500"
                }`}
              >
                {isConfirm ? (
                  <AlertTriangle size={24} />
                ) : isLoading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : isSuccess ? (
                  <CheckCircle2 size={24} />
                ) : (
                  <XCircle size={24} />
                )}
              </div>

              <h3 className="sibs-modal-title break-words text-sibs-navy">
                {finalTitle}
              </h3>
            </div>
          </div>

          <p className="sibs-modal-subtitle mt-2 whitespace-pre-line text-[#475467]">
            {finalMessage}
          </p>

          {!isLoading && (
          <div className="mt-5 2xl:mt-6 flex justify-end gap-2.5">
            {isConfirm && (
              <button
                type="button"
                onClick={() => onCancel?.()}
                className="sibs-modal-btn-secondary"
              >
                {cancelLabel}
              </button>
            )}

            <button
              type="button"
              onClick={isConfirm ? () => onConfirm?.() : handleClose}
              className={`sibs-modal-btn-primary ${
                  isConfirm
                    ? confirmTone === "brand"
                      ? "!bg-[#042C51] hover:!bg-[#073B6C]"
                      : "!bg-red-600 hover:!bg-red-700"
                    : ""
              }`}
            >
              {isConfirm ? confirmLabel : "OK"}
            </button>
          </div>
          )}
        </div>
      ) : (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className="sibs-modal-pop-in relative w-full max-w-md overflow-hidden rounded-2xl border border-[#D7DEE8] bg-white p-5 2xl:p-6 shadow-2xl font-jakarta"
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={`mb-3.5 2xl:mb-4 flex h-12 w-12 2xl:h-14 2xl:w-14 items-center justify-center rounded-full ${
                isConfirm
                  ? "bg-amber-50 text-amber-500"
                  : isLoading
                    ? "bg-[#EFF6FF] text-sibs-primary-1"
                  : isSuccess
                    ? "bg-emerald-50 text-emerald-500"
                    : "bg-red-50 text-red-500"
              }`}
            >
              {isConfirm ? (
                <AlertTriangle size={26} />
              ) : isLoading ? (
                <Loader2 size={26} className="animate-spin" />
              ) : isSuccess ? (
                <CheckCircle2 size={26} />
              ) : (
                <XCircle size={26} />
              )}
            </div>

            <h2 className="sibs-modal-title text-sibs-navy">
              {finalTitle}
            </h2>

            <p className="sibs-modal-subtitle mt-2 whitespace-pre-line text-[#475467]">
              {finalMessage}
            </p>

            {!isLoading && (
            <div className="mt-5 2xl:mt-6 flex w-full gap-2.5">
              {isConfirm && (
                <button
                  type="button"
                  onClick={() => onCancel?.()}
                  className="sibs-modal-btn-secondary flex-1"
                >
                  {cancelLabel}
                </button>
              )}

              <button
                type="button"
                onClick={isConfirm ? () => onConfirm?.() : handleClose}
                className={`sibs-modal-btn-primary flex-1 ${
                isConfirm
                  ? confirmTone === "brand"
                    ? "!bg-[#042C51] hover:!bg-[#073B6C]"
                    : "!bg-red-600 hover:!bg-red-700"
                  : ""
                }`}
              >
                {isConfirm ? confirmLabel : "OK"}
              </button>
            </div>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
