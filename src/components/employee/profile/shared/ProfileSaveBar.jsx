import { Save } from "lucide-react";

export default function ProfileSaveBar({ label, onCancel, onSave }) {
  return (
    <div className="sticky bottom-3 z-40 mt-6 flex flex-col gap-3 rounded-xl border border-sibs-border bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between font-jakarta">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        <span className="sibs-text-xs font-black text-sibs-navy">
          Modified draft: {label}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-8 flex-1 rounded-lg bg-[#F1F5F9] px-3 sibs-text-xs font-black text-sibs-muted transition hover:bg-[#E2E8F0] hover:text-sibs-navy sm:flex-none"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-sibs-navy px-4 sibs-text-xs font-black text-white transition hover:bg-sibs-tertiary-2 sm:flex-none"
        >
          <Save size={13} className="text-sibs-orange" />
          Save Changes
        </button>
      </div>
    </div>
  );
}
