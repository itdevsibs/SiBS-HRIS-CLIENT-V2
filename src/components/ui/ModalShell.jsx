import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Universal ModalShell component
 * Handles:
 * - createPortal mounting to document.body
 * - Backdrop blur & keyframe fade in (.sibs-modal-blur, .sibs-modal-backdrop-in)
 * - Container pop-in (.sibs-modal-pop-in)
 * - Gradient top accent bar (.sibs-top-accent)
 * - ESC key and backdrop click listeners
 * - Body scroll locking with clean restoration
 * - Standardized header with title, subtitle, optional icon & close button
 * - Optional footer slot with standardized action buttons (.sibs-modal-btn-*)
 */
export default function ModalShell({
  open = false,
  onClose,
  title,
  subtitle,
  icon: Icon,
  badge,
  maxWidth = "max-w-xl",
  children,
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
  lockScroll = true,
  className = "",
  bodyClassName = "",
  headerClassName = "",
  footerClassName = "",
  hideCloseButton = false,
}) {
  const previousOverflowRef = useRef({
    body: "",
    html: "",
  });

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    const handleKeyDown = (e) => {
      if (closeOnEscape && e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    if (lockScroll) {
      previousOverflowRef.current = {
        body: document.body.style.overflow,
        html: document.documentElement.style.overflow,
      };

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      if (lockScroll) {
        document.body.style.overflow = previousOverflowRef.current.body || "";
        document.documentElement.style.overflow =
          previousOverflowRef.current.html || "";
      }
    };
  }, [open, onClose, closeOnEscape, lockScroll]);

  if (typeof document === "undefined" || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 sibs-modal-blur sibs-modal-backdrop-in transition-opacity"
        aria-hidden="true"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Dialog container */}
      <div
        className={`relative z-10 w-full ${maxWidth} overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white font-jakarta shadow-2xl sibs-modal-pop-in ${className}`}
      >
        <span className="sibs-top-accent" aria-hidden="true" />

        {/* Header */}
        {(title || subtitle || !hideCloseButton) && (
          <div
            className={`flex items-start justify-between gap-4 border-b border-[#EEF2F6] px-5 py-4 2xl:px-6 2xl:py-5 ${headerClassName}`}
          >
            <div className="min-w-0 space-y-1">
              {badge && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-navy">
                    <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-sibs-orange" />
                    {badge}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                {Icon && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF0EB] text-sibs-orange">
                    <Icon className="h-4 w-4" />
                  </div>
                )}
                {title && (
                  <h2 className="font-heading text-lg 2xl:text-xl font-bold tracking-tight text-sibs-navy">
                    {title}
                  </h2>
                )}
              </div>

              {subtitle && (
                <p className="sibs-text-xs font-semibold leading-relaxed text-[#667085]">
                  {subtitle}
                </p>
              )}
            </div>

            {!hideCloseButton && onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white text-[#667085] shadow-xs outline-none transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] active:scale-[0.98]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={`p-5 2xl:p-6 ${bodyClassName}`}>{children}</div>

        {/* Footer */}
        {footer && (
          <div
            className={`flex flex-wrap items-center justify-end gap-2.5 border-t border-[#EEF2F6] bg-[#F8FAFC] px-5 py-3.5 2xl:px-6 2xl:py-4 ${footerClassName}`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
