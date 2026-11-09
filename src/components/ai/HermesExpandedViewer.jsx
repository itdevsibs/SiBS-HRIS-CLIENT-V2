import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2, ShieldCheck, X } from "lucide-react";

/**
 * HermesExpandedViewer
 *
 * Full-width dialog for wide tables and extensive business reports.
 * Allows comfortable horizontal scrolling and reading of multi-column reports
 * without horizontal cramping in the narrow 430px chat sidebar.
 */
export default function HermesExpandedViewer({
  open,
  title = "Report Details",
  subtitle,
  verified = false,
  system,
  scope,
  children,
  onClose,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open, onClose]);

  if (!open) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[2147483640] flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-sibs-navy/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        ref={dialogRef}
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-sibs-border bg-white shadow-2xl transition-transform duration-200"
      >
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-sibs-border-subtle bg-sibs-surface/80 px-5 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sibs-navy text-white shadow-xs">
              <Maximize2 size={16} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="truncate font-heading text-base font-bold text-sibs-navy">
                  {title}
                </h3>
                {verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    <ShieldCheck size={12} className="text-emerald-600" />
                    Verified {system ? `${system} Data` : "HRIS Data"}
                  </span>
                ) : null}
                {scope ? (
                  <span className="inline-flex items-center rounded-full bg-sibs-cream-light px-2 py-0.5 text-[11px] font-semibold text-sibs-secondary border border-sibs-border-subtle">
                    {scope}
                  </span>
                ) : null}
              </div>
              {subtitle ? (
                <p className="mt-0.5 truncate sibs-text-micro font-medium text-sibs-muted">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close expanded view"
            className="rounded-xl border border-sibs-border-subtle p-2 text-sibs-muted hover:bg-sibs-surface hover:text-sibs-navy transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-5 space-y-4">
          {children}
        </div>

        {/* Modal Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-sibs-border-subtle bg-sibs-surface/40 px-5 py-3 rounded-b-2xl">
          <span className="sibs-text-micro font-semibold text-sibs-faint">
            Press Esc or click outside to dismiss
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-sibs-navy px-4 py-1.5 sibs-text-xs font-bold text-white hover:bg-sibs-secondary transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}
