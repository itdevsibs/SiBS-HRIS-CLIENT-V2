import { Sparkles, X } from "lucide-react";

export default function AdminDashboardToast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="sibs-toast-in fixed right-4 top-20 z-[1200] flex max-w-[360px] items-start gap-3 rounded-r-xl border-l-4 border-[#FF5C28] bg-[#042C51] px-4 py-3 text-white shadow-2xl sm:right-6">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5C28]" />

      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold">
          {toast.title || "Dashboard Update"}
        </p>

        {toast.message ? (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-200">
            {toast.message}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white"
        aria-label="Close notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
