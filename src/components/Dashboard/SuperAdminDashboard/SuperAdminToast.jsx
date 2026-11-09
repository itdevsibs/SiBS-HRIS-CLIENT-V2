import { ShieldCheck, X } from "lucide-react";

export default function SuperAdminToast({ message, onClose }) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sibs-toast-in fixed right-4 top-20 z-[9999] flex max-w-sm items-center gap-3 rounded-r-xl border-l-4 border-sibs-orange bg-sibs-navy px-4 py-3 text-xs font-extrabold text-white shadow-2xl sm:right-5"
    >
      <ShieldCheck aria-hidden="true" size={16} className="shrink-0 text-sibs-orange" />
      <span className="min-w-0 flex-1">{message}</span>
      <button type="button" onClick={onClose} aria-label="Close notification">
        <X aria-hidden="true" size={15} />
      </button>
    </div>
  );
}
