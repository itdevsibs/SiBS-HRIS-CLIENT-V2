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
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[99999] flex items-center justify-center p-2 font-jakarta sm:p-4"
      onClick={onClose}
    >
      <div
        className="sibs-modal-pop-in w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl font-jakarta"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E6ECF2] pb-3">
          <h3 className="sibs-modal-title text-[#042C51]">
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
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 font-jakarta sibs-text-xs font-extrabold text-[#667085] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg bg-[#042C51] px-4 2xl:px-5 font-jakarta sibs-text-xs font-extrabold text-white transition hover:bg-[#073B6C]"
            >
              Add Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
