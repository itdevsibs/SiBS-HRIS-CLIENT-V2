import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Universal ModalShell component
 * Handles:
 * - createPortal mounting to document.body
 * - Backdrop blur & keyframe fade in (.sibs-modal-blur, .sibs-modal-backdrop-in)
 * - Container pop-in (.sibs-modal-pop-in)
 * - Standardized SiBS Navy header (default) or White header variant
 * - Gradient top accent bar (.sibs-top-accent) on white variant
 * - ESC key and backdrop click listeners
 * - Body scroll locking with clean restoration
 * - Standardized header with title, subtitle, optional icon & close button
 * - Optional footer slot with standardized action buttons
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
  variant = "navy",
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

  if (!open || typeof document === "undefined") return null;

  const isNavy = variant === "navy";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto font-jakarta"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 sibs-modal-blur sibs-modal-backdrop-in transition-opacity"
        aria-hidden="true"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Dialog container */}
      <div
        className={`relative z-10 w-full ${maxWidth} max-sm:max-h-[92dvh] max-sm:rounded-b-none overflow-hidden rounded-2xl border border-sibs-border bg-white font-jakarta shadow-2xl sibs-modal-pop-in ${className}`}
      >
        {!isNavy && <span className="sibs-top-accent" aria-hidden="true" />}

        {/* Header */}
        {(title || subtitle || !hideCloseButton) && (
          <div
            className={
              isNavy
                ? `flex items-center justify-between gap-4 bg-sibs-navy px-5 py-3 text-white sm:px-6 2xl:py-3.5 ${headerClassName}`
                : `flex items-start justify-between gap-4 border-b border-sibs-border px-5 py-4 2xl:px-6 2xl:py-5 ${headerClassName}`
            }
          >
            <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
              {Icon && (
                <span
                  className={
                    isNavy
                      ? "flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-sibs-orange text-white shadow-sm"
                      : "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sibs-cream-subtle text-sibs-orange"
                  }
                >
                  <Icon size={16} />
                </span>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  {title && (
                    <h2
                      className={
                        isNavy
                          ? "sibs-modal-title truncate text-white"
                          : "font-heading text-lg 2xl:text-xl font-bold tracking-tight text-sibs-navy"
                      }
                    >
                      {title}
                    </h2>
                  )}

                  {badge && (
                    <span
                      className={
                        isNavy
                          ? "rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-white/90"
                          : "inline-flex items-center gap-1.5 rounded border border-blue-100 bg-blue-50 px-2 py-0.5 sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-navy"
                      }
                    >
                      {!isNavy && (
                        <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-sibs-orange" />
                      )}
                      {badge}
                    </span>
                  )}
                </div>

                {subtitle && (
                  <p
                    className={
                      isNavy
                        ? "sibs-modal-subtitle mt-0.5 truncate text-white/75 sm:text-clip"
                        : "sibs-text-xs font-semibold leading-relaxed text-sibs-muted"
                    }
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {!hideCloseButton && onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className={
                  isNavy
                    ? "sibs-modal-close-btn"
                    : "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sibs-border-subtle bg-white text-sibs-muted shadow-xs outline-none transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange active:scale-[0.98]"
                }
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={`p-5 2xl:p-6 ${bodyClassName}`}>{children}</div>

        {/* Footer */}
        {footer && (
          <div
            className={`flex flex-wrap items-center justify-end gap-2.5 border-t border-sibs-border bg-sibs-surface px-5 py-3.5 2xl:px-6 2xl:py-4 ${footerClassName}`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
