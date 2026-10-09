import React from "react";
import { UploadCloud } from "lucide-react";

import { ModalShell } from "@/components/ui";

export default function DocumentUploadModal({
  open,
  onClose,
  onSubmit,
  name,
  onNameChange,
  category,
  onCategoryChange,
  categories = [],
}) {
  return (
    <ModalShell
      open={Boolean(open)}
      onClose={onClose}
      variant="navy"
      icon={UploadCloud}
      title="Configure Upload"
      subtitle="Attach document to employee record"
      maxWidth="max-w-md"
      bodyClassName="p-5 font-jakarta"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="sibs-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="document-upload-form"
            className="sibs-btn-primary"
          >
            Add Document
          </button>
        </div>
      }
    >
      <form
        id="document-upload-form"
        onSubmit={onSubmit}
        className="space-y-4 font-jakarta"
      >
        <div>
          <label htmlFor="upload-doc-name" className="sibs-modal-field-label">
            File Name <span className="text-sibs-orange">*</span>
          </label>
          <input
            id="upload-doc-name"
            type="text"
            required
            value={name || ""}
            onChange={(e) => onNameChange?.(e.target.value)}
            placeholder="employee-document.pdf"
            className="sibs-modal-input"
          />
        </div>

        <div>
          <label
            htmlFor="upload-doc-category"
            className="sibs-modal-field-label"
          >
            Category
          </label>
          <select
            id="upload-doc-category"
            value={category || ""}
            onChange={(e) => onCategoryChange?.(e.target.value)}
            className="sibs-modal-input cursor-pointer"
          >
            <option value="">Select category...</option>
            {Array.isArray(categories) &&
              categories
                .filter(Boolean)
                .map((cat) => {
                  const val =
                    typeof cat === "object" && cat !== null ? cat.value : cat;
                  const lbl =
                    typeof cat === "object" && cat !== null ? cat.label : cat;
                  return (
                    <option key={val} value={val}>
                      {lbl}
                    </option>
                  );
                })}
          </select>
        </div>
      </form>
    </ModalShell>
  );
}
