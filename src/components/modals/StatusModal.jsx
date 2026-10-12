import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
  XCircle,
} from "lucide-react";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * One global design for the app's feedback and confirmation dialogs.
 * Large form/detail modals intentionally retain their own layouts.
 * Background clicks never dismiss these dialogs.
 */
export default function StatusModal({
  open,
  type = "success",
  title,
  message,
  subtitle,
  section,
  notice,
  children,
  onClose,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  // Kept for compatibility with existing callers.
  confirmTone = "brand",
  variant = "center",
  design = "panel",
  lockScroll = true,
  loading = false,
  icon: CustomIcon,
  maxWidth = "max-w-md",
  closeOnEscape = false,
}) {
  const dialogId = useId();
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const isLoading = loading || type === "loading";
  const isConfirm = type === "confirm";
  const isSuccess = type === "success";
  const isDanger = type === "danger" || type === "error";
  const isWarning = type === "warning" || isConfirm;

  const finalTitle =
    title ||
    (isLoading
      ? "Processing"
      : isConfirm
        ? "Confirm Action"
        : isSuccess
          ? "Success"
          : isDanger
            ? "Something went wrong"
            : "Notice");
  const finalMessage =
    message ||
    (isLoading
      ? "Please wait while your changes are being saved."
      : isConfirm
        ? "Are you sure you want to continue?"
        : "Operation completed.");

  const Icon =
    CustomIcon ||
    (isLoading
      ? Loader2
      : isWarning
        ? AlertTriangle
        : isSuccess
          ? CheckCircle2
          : isDanger
            ? XCircle
            : Info);

  // The form/detail modals may already lock body scrolling; restore precisely
  // the previously active state so closing this dialog never unlocks a parent.
  useEffect(() => {
    if (!open || !lockScroll || typeof document === "undefined") return undefined;
    const previousBody = document.body.style.overflow;
    const previousHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBody;
      document.documentElement.style.overflow = previousHtml;
    };
  }, [open, lockScroll]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    previouslyFocusedRef.current = document.activeElement;
    const frame = dialogRef.current;
    const first = frame?.querySelector(FOCUSABLE_SELECTOR);
    (first || frame)?.focus();
    return () => {
      if (previouslyFocusedRef.current?.isConnected) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [open]);

  const cancelAction = () => (onCancel || onClose)?.();
  const dismissAction = () => {
    if (isLoading) return;
    if (isConfirm) cancelAction();
    else onClose?.();
  };

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        // Prevent underlying modal from closing when the top dialog is active.
        event.preventDefault();
        event.stopImmediatePropagation?.();
        event.stopPropagation();
        if (closeOnEscape && !isLoading) {
          if (isConfirm) (onCancel || onClose)?.();
          else onClose?.();
        }
      }
      if (event.key === "Tab" && dialogRef.current) {
        const items = [...dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)];
        if (!items.length) {
          event.preventDefault();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeydown, true);
    return () => document.removeEventListener("keydown", handleKeydown, true);
  }, [open, closeOnEscape, isLoading, isConfirm, onCancel, onClose]);

  if (!open || typeof document === "undefined") return null;

  // Keep older caller props valid without changing the shared visual design.
  void design;
  void variant;
  void confirmTone;

  return createPortal(
    <div className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[2000000] flex h-dvh items-center justify-center p-3 font-jakarta sm:p-4"
      onClick={(event) => event.stopPropagation()}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogId}
        aria-describedby={`${dialogId}-description`}
        className={`sibs-modal-pop-in flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl outline-none ${maxWidth}`}
      >
        <header className="shrink-0 bg-sibs-navy px-4 py-3 text-white sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5 2xl:gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-sibs-orange 2xl:h-9 2xl:w-9">
                <Icon className={`h-4 w-4 text-sibs-orange ${isLoading ? "animate-spin" : ""}`} />
              </span>
              <div className="min-w-0">
                <p className="sibs-modal-subtitle truncate text-white/75 sm:text-clip">
                  {subtitle || section || "SiBS HRIS"}
                </p>
                <h3 id={dialogId} className="sibs-modal-title mt-0.5 break-words text-white">
                  {finalTitle}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissAction}
              disabled={isLoading}
              className="sibs-modal-close-btn shrink-0"
              aria-label="Close dialog"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <p id={`${dialogId}-description`} className="whitespace-pre-line break-words text-xs font-semibold leading-relaxed text-sibs-muted">
            {finalMessage}
          </p>
          {notice ? (
            <div className="mt-3.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[10px] font-semibold leading-relaxed text-amber-800">
              {notice}
            </div>
          ) : null}
          {children}
        </div>

        {!isLoading ? (
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-sibs-border bg-slate-50 px-4 py-3 sm:flex-row sm:justify-end sm:gap-2.5 sm:px-5">
            {isConfirm ? (
              <button type="button" onClick={cancelAction} className="sibs-modal-btn-secondary">
                {cancelLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={isConfirm ? () => onConfirm?.() : dismissAction}
              className="sibs-modal-btn-primary"
            >
              {isConfirm ? confirmLabel : "OK"}
            </button>
          </footer>
        ) : (
          <footer className="flex shrink-0 justify-end border-t border-sibs-border bg-slate-50 px-4 py-3 sm:px-5">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-sibs-muted">
              <Loader2 size={14} className="animate-spin" /> Processing...
            </span>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
