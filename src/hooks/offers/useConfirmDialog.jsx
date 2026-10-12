import { useState } from "react";
import { FileCheck2 } from "lucide-react";
import StatusModal from "@/components/modals/StatusModal";

export function useConfirmDialog() {
  const [config, setConfig] = useState(null);
  const [notes, setNotes] = useState("");

  function confirmAction(message, options = {}) {
    return new Promise((resolve) => {
      setNotes(String(options.notes || ""));
      setConfig({
        title: options.title || "Confirm Action",
        message,
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        showNotes: Boolean(options.showNotes),
        resolve,
      });
    });
  }

  function close(answer) {
    if (config?.resolve) {
      config.resolve({
        confirmed: Boolean(answer),
        notes: answer ? String(notes || "").trim() : "",
      });
    }
    setNotes("");
    setConfig(null);
  }

  const ConfirmationDialog = (
    <StatusModal
      open={Boolean(config)}
      type="confirm"
      subtitle="Employment Offers"
      title={config?.title || "Confirm Action"}
      message={config?.message}
      icon={FileCheck2}
      confirmLabel={config?.confirmText || "Confirm"}
      cancelLabel={config?.cancelText || "Cancel"}
      onClose={() => close(false)}
      onCancel={() => close(false)}
      onConfirm={() => close(true)}
    >
      {config?.showNotes ? (
        <label className="mt-3.5 block">
          <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
            Notes <span className="font-semibold normal-case">(Optional)</span>
          </span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add notes for this action..."
            rows={3}
            className="sibs-input min-h-20 w-full resize-none py-2.5"
          />
        </label>
      ) : null}
    </StatusModal>
  );

  return { confirmAction, ConfirmationDialog };
}

export default useConfirmDialog;
