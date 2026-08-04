import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

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
  variant = "center", // center | compact
  lockScroll = false,
}) {
  const [mounted, setMounted] = useState(false);

  const previousOverflowRef = useRef({
    body: "",
    html: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
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

  const finalTitle =
    title ||
    (isConfirm
      ? "Confirm Action"
      : isSuccess
        ? "Success"
        : "Something went wrong");

  const finalMessage =
    message ||
    (isConfirm
      ? "Are you sure you want to continue?"
      : "Operation completed.");

  const handleClose = () => {
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
      className="sibs-modal-blur fixed left-0 top-0 z-[999999] flex h-[100dvh] w-[100dvw] items-center justify-center px-4"
      onClick={handleClose}
    >
      {variant === "compact" ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl border border-sibs-tertiary-9 bg-white p-6 shadow-2xl"
        >
          <div className="mb-4 flex items-start gap-4">
            <div className="flex min-w-0 flex-row items-center gap-2">
              <div
                className={`shrink-0 rounded-2xl p-3 ${
                  isConfirm ? "bg-amber-100" : isSuccess ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {isConfirm ? (
                  <AlertTriangle size={24} className="text-amber-600" />
                ) : isSuccess ? (
                  <CheckCircle2 size={24} className="text-green-600" />
                ) : (
                  <XCircle size={24} className="text-red-600" />
                )}
              </div>

              <h3 className="break-words text-xl font-semibold text-sibs-primary-1">
                {finalTitle}
              </h3>
            </div>
          </div>

          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-sibs-tertiary-5">
            {finalMessage}
          </p>

          <div className="mt-6 flex justify-end gap-2">
            {isConfirm && (
              <button
                type="button"
                onClick={() => onCancel?.()}
                className="rounded-xl border border-sibs-tertiary-9 bg-white px-4 py-2.5 text-sm font-semibold text-sibs-tertiary-5 transition hover:bg-slate-50 active:scale-[0.98]"
              >
                {cancelLabel}
              </button>
            )}

            <button
              type="button"
              onClick={isConfirm ? () => onConfirm?.() : handleClose}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] ${
                isConfirm ? "bg-red-600" : "bg-[var(--sibs-primary-1)]"
              }`}
            >
              {isConfirm ? confirmLabel : "OK"}
            </button>
          </div>
        </div>
      ) : (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-sibs-tertiary-9 bg-white shadow-2xl"
        >
          <div className="px-6 py-6">
            <div className="flex flex-col items-center text-center">
              <div
                className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                  isConfirm ? "bg-amber-100" : isSuccess ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {isConfirm ? (
                  <AlertTriangle size={34} className="text-amber-600" />
                ) : isSuccess ? (
                  <CheckCircle2 size={34} className="text-green-600" />
                ) : (
                  <XCircle size={34} className="text-red-600" />
                )}
              </div>

              <h2 className="text-2xl font-bold text-sibs-primary-1">
                {finalTitle}
              </h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-sibs-tertiary-5">
                {finalMessage}
              </p>

              <div className="mt-6 flex w-full gap-2">
                {isConfirm && (
                  <button
                    type="button"
                    onClick={() => onCancel?.()}
                    className="flex-1 rounded-xl border border-sibs-tertiary-9 bg-white px-4 py-3 text-sm font-semibold text-sibs-tertiary-5 transition hover:bg-slate-50 active:scale-[0.98]"
                  >
                    {cancelLabel}
                  </button>
                )}

                <button
                  type="button"
                  onClick={isConfirm ? () => onConfirm?.() : handleClose}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] ${
                    isConfirm ? "bg-red-600" : "bg-[var(--sibs-primary-1)]"
                  }`}
                >
                  {isConfirm ? confirmLabel : "OK"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
