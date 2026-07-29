import { Save } from "lucide-react";

export default function ProfileSaveBar({ label, onCancel, onSave }) {
  return (
    <div className="sticky bottom-3 z-40 mt-6 flex flex-col gap-3 rounded-xl border border-[#E6ECF2] bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        <span className="text-[11px] font-black text-[#042C51]">
          Modified draft: {label}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-8 flex-1 rounded-lg bg-slate-100 px-3 text-[11px] font-black text-[#667085] transition hover:bg-slate-200 sm:flex-none"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#042C51] px-4 text-[11px] font-black text-white transition hover:bg-[#063560] sm:flex-none"
        >
          <Save size={13} className="text-[#FF5C28]" />
          Save Changes
        </button>
      </div>
    </div>
  );
}
