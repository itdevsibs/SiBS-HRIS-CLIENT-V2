import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

let activeScrollLockCount = 0;
let savedBodyOverflow = "";
let savedHtmlOverflow = "";

function lockBodyScroll() {
  if (activeScrollLockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    savedHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }
  activeScrollLockCount += 1;
}

function unlockBodyScroll() {
  activeScrollLockCount = Math.max(0, activeScrollLockCount - 1);
  if (activeScrollLockCount === 0) {
    document.body.style.overflow = savedBodyOverflow;
    document.documentElement.style.overflow = savedHtmlOverflow;
    savedBodyOverflow = "";
    savedHtmlOverflow = "";
  }
}

/**
 * Universal ModalShell component
 * Handles:
 * - createPortal mounting to document.body
 * - Backdrop blur & keyframe fade in (.sibs-modal-blur, .sibs-modal-backdrop-in)
 * - Container pop-in (.sibs-modal-pop-in)
 * - Standardized SiBS Navy header (default) or White header variant
 * - Gradient top accent bar (.sibs-top-accent) on white variant
 * - ESC key and backdrop click listeners
 * - Body scroll locking with nested counter and clean restoration
 * - Accessible keyboard focus trap & restoration
 * - Centered mobile layout by default, optional mobileBottomSheet
 * - Header and footer customization slots (headerMeta, headerActions, footerMeta)
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
  mobileBottomSheet = false,
  headerMeta = null,
  headerActions = null,
  footerMeta = null,
  initialFocusRef = null,
}) {
  const dialogRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);

  // Scroll lock management
  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    if (lockScroll) {
      lockBodyScroll();
    }

    return () => {
      if (lockScroll) {
        unlockBodyScroll();
      }
    };
  }, [open, lockScroll]);

  // Focus trap initial focus & focus restoration
  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    previouslyFocusedElementRef.current = document.activeElement;

    if (dialogRef.current) {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const focusables = dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          dialogRef.current.focus();
        }
      }
    }

    return () => {
      if (
        previouslyFocusedElementRef.current &&
        typeof previouslyFocusedElementRef.current.focus === "function"
      ) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [open, initialFocusRef]);

  // ESC key listener & Tab key focus trap
  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    const handleKeyDown = (e) => {
      if (closeOnEscape && e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }

      if (e.key === "Tab") {
        if (!dialogRef.current) return;
        const focusables = Array.from(
          dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
        );

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            !dialogRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !dialogRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, closeOnEscape]);

  if (!open || typeof document === "undefined") return null;

  const isNavy = variant === "navy";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-[9999] flex ${
        mobileBottomSheet
          ? "items-end sm:items-center justify-center p-0 sm:p-4"
          : "items-center justify-center p-3 sm:p-4"
      } font-jakarta`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 sibs-modal-blur sibs-modal-backdrop-in transition-opacity"
        aria-hidden="true"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Dialog container */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`relative z-10 flex flex-col max-h-[88dvh] sm:max-h-[88vh] 2xl:max-h-[86vh] w-full ${maxWidth} ${
          mobileBottomSheet ? "max-sm:rounded-b-none" : ""
        } overflow-hidden rounded-2xl border border-sibs-border bg-white font-jakarta shadow-2xl sibs-modal-pop-in ${className}`}
      >
        {!isNavy && <span className="sibs-top-accent" aria-hidden="true" />}

        {/* Header */}
        {(title ||
          subtitle ||
          badge ||
          headerMeta ||
          headerActions ||
          (!hideCloseButton && onClose)) && (
          <div
            className={
              isNavy
                ? `flex shrink-0 items-center justify-between gap-4 bg-sibs-navy px-5 py-3 text-white sm:px-6 2xl:py-3.5 ${headerClassName}`
                : `flex shrink-0 items-start justify-between gap-4 border-b border-sibs-border px-5 py-4 2xl:px-6 2xl:py-5 ${headerClassName}`
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
                      className={`sibs-modal-title truncate ${
                        isNavy ? "text-white" : "text-sibs-navy"
                      }`}
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

                  {headerMeta && (
                    <div className="inline-flex items-center">
                      {headerMeta}
                    </div>
                  )}
                </div>

                {subtitle && (
                  <p
                    className={`sibs-modal-subtitle mt-0.5 truncate sm:text-clip ${
                      isNavy ? "text-white/75" : "text-sibs-muted"
                    }`}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {headerActions}

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
          </div>
        )}

        {/* Body */}
        <div
          className={`min-h-0 flex-1 overflow-y-auto sibs-scrollbar ${
            /\b(?:p|px|py|pt|pb|pl|pr)-[^\s]+/.test(typeof bodyClassName === "string" ? bodyClassName : "")
              ? ""
              : "p-5 2xl:p-6"
          } ${typeof bodyClassName === "string" ? bodyClassName.trim() : ""}`.trim()}
        >
          {children}
        </div>

        {/* Footer */}
        {(footer || footerMeta) && (
          <div
            className={`flex shrink-0 flex-wrap items-center ${
              footerMeta ? "justify-between" : "justify-end"
            } gap-2.5 border-t border-sibs-border bg-sibs-surface px-5 py-3.5 2xl:px-6 2xl:py-4 ${footerClassName}`}
          >
            {footerMeta && <div className="min-w-0 flex-1">{footerMeta}</div>}
            {footer && (
              <div className="flex flex-wrap items-center justify-end gap-2.5">
                {footer}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
