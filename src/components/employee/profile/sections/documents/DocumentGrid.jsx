import { Eye, Trash2 } from "lucide-react";

import { formatDisplayDate } from "../../../../../lib/utils/employees/employeeProfileHelpers.js";
import { getDocumentFileType } from "./documentPresentation.js";

export default function DocumentGrid({ documents, onPreview, onDelete }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((document, index) => (
        <article
          key={document?.id || index}
          className="sibs-page-card-in sibs-card p-4"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[10px] font-extrabold text-red-600">
              {getDocumentFileType(document?.name)}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xs font-extrabold text-[#344054]">
                {document?.name}
              </h3>
              <p className="mt-1 text-[9px] text-[#667085]">
                Uploaded {formatDisplayDate(document?.uploadedAt)}
              </p>
              <span className="mt-2 inline-flex rounded-full bg-[#E9F0FC] px-2.5 py-1 text-[9px] font-extrabold text-[#042C51]">
                {document?.category || "Other"}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#E6ECF2] pt-3">
            <span className="font-mono text-[10px] text-[#667085]">
              {document?.fileSize || "—"}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onPreview(document)}
                className="rounded-lg p-1.5 text-[#667085] hover:bg-[#E9F0FC]"
                aria-label={`Preview ${document?.name || "document"}`}
              >
                <Eye size={14} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(document)}
                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                aria-label={`Delete ${document?.name || "document"}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
