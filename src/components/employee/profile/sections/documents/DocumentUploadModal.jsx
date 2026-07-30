import { X } from "lucide-react";

import { ProfileFieldControl } from "../../shared/ProfileFields.jsx";

export default function DocumentUploadModal({
  open,
  onClose,
  onSubmit,
  name,
  onNameChange,
  category,
  onCategoryChange,
  categories,
}) {
  if (!open) return null;

  return (
    <div
      className="sibs-modal-backdrop-in fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="sibs-modal-pop-in w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E6ECF2] pb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
            Configure Upload
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#98A2B3] hover:bg-[#F8FAFC]"
            aria-label="Close upload dialog"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <ProfileFieldControl
            label="File Name"
            value={name}
            onChange={onNameChange}
            required
            placeholder="employee-document.pdf"
          />
          <ProfileFieldControl
            label="Category"
            type="select"
            options={categories}
            value={category}
            onChange={onCategoryChange}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-xl border border-[#D6E0EA] px-4 text-xs font-extrabold text-[#667085]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 rounded-xl bg-[#042C51] px-5 text-xs font-extrabold text-white"
            >
              Add Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
