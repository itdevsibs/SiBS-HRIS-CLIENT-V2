import { useState } from "react";
import { createPortal } from "react-dom";
import { FileCheck2, X } from "lucide-react";

export function useConfirmDialog() {
  const [config, setConfig] = useState(null);

  function confirmAction(message, options = {}) {
    return new Promise((resolve) => {
      setConfig({
        title: options.title || "Confirm Action",
        message,
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        variant: options.variant || "default",
        resolve,
      });
    });
  }

  function close(answer) {
    if (config?.resolve) {
      config.resolve(answer);
    }

    setConfig(null);
  }

  function ConfirmationDialog() {
    if (!config || typeof document === "undefined") return null;

    const isDanger = config.variant === "danger";

    return createPortal(
      <div
        className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[1000000] flex h-dvh items-center justify-center p-4 font-jakarta"
        onClick={() => close(false)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-confirmation-title"
          className="sibs-modal-pop-in flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#D6DEE8] bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-[#042C51] px-5 py-4 text-white sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
                <FileCheck2 size={17} strokeWidth={2.2} />
              </span>

              <div className="min-w-0">
                <h2
                  id="offer-confirmation-title"
                  className="truncate font-heading text-base font-bold tracking-tight text-white"
                >
                  {config.title}
                </h2>
                <p className="mt-0.5 truncate text-[10.5px] font-semibold text-white/70">
                  Review the action before continuing.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => close(false)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close confirmation"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <p className="text-sm font-semibold leading-6 text-[#475467]">
              {config.message}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[#E6ECF2] bg-[#F8FAFC] px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => close(false)}
              className="inline-flex h-10 min-w-[90px] items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-[#475467] transition hover:bg-white hover:text-[#042C51]"
            >
              {config.cancelText}
            </button>

            <button
              type="button"
              onClick={() => close(true)}
              className={`inline-flex h-10 min-w-[104px] items-center justify-center rounded-xl px-4 text-xs font-extrabold text-white shadow-sm transition active:scale-[0.98] ${
                isDanger
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-[#042C51] hover:bg-[#073B6C]"
              }`}
            >
              {config.confirmText}
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  return {
    confirmAction,
    ConfirmationDialog,
  };
}

export default useConfirmDialog;
