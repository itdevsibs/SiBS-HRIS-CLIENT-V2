import { useState } from "react";
import { X } from "lucide-react";

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
    if (!config) return null;

    const isDanger = config.variant === "danger";

    return (
      <div className="fixed inset-0 z-[11000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-sibs-primary-1">
                {config.title}
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-[#475467]">
                {config.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => close(false)}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => close(false)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC]"
            >
              {config.cancelText}
            </button>

            <button
              type="button"
              onClick={() => close(true)}
              className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                isDanger ? "bg-red-600" : "bg-sibs-primary-1"
              }`}
            >
              {config.confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return {
    confirmAction,
    ConfirmationDialog,
  };
}

export default useConfirmDialog;
