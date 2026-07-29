import { Download, Eye, Trash2 } from "lucide-react";

import { formatDisplayDate } from "../../../../../lib/utils/employees/employeeProfileHelpers.js";
import { getDocumentFileType } from "./documentPresentation.js";

export default function DocumentTable({
  documents,
  onPreview,
  onDownload,
  onDelete,
}) {
  return (
    <div className="sibs-data-table-shell overflow-hidden rounded-2xl border border-[#D6E0EA]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse bg-white text-left text-xs">
          <thead className="sibs-data-table-head bg-[#F8FAFC]">
            <tr className="sibs-data-table-head-row border-b border-[#D6E0EA] text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
              <th className="sibs-data-table-th px-4 py-3">Document</th>
              <th className="sibs-data-table-th px-4 py-3">Category</th>
              <th className="sibs-data-table-th px-4 py-3">Size</th>
              <th className="sibs-data-table-th px-4 py-3">Uploaded By</th>
              <th className="sibs-data-table-th px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6ECF2]">
            {documents.map((document, index) => (
              <tr
                key={document?.id || index}
                className="sibs-data-table-row hover:bg-[#F8FAFC]"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[10px] font-extrabold text-red-600">
                      {getDocumentFileType(document?.name)}
                    </span>
                    <div>
                      <p className="max-w-xs truncate font-extrabold text-[#344054]">
                        {document?.name}
                      </p>
                      <p className="mt-0.5 text-[9px] text-[#667085]">
                        Uploaded {formatDisplayDate(document?.uploadedAt)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-[#E9F0FC] px-2.5 py-1 text-[9px] font-extrabold text-[#042C51]">
                    {document?.category || "Other"}
                  </span>
                </td>
                <td className="px-4 py-4 font-mono text-[#667085]">
                  {document?.fileSize || "—"}
                </td>
                <td className="px-4 py-4 font-semibold text-[#52637A]">
                  {document?.uploadedBy || "—"}
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onPreview(document)}
                      className="rounded-lg p-2 text-[#667085] hover:bg-[#E9F0FC] hover:text-[#042C51]"
                      aria-label={`Preview ${document?.name || "document"}`}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownload(document)}
                      className="rounded-lg p-2 text-[#667085] hover:bg-[#E9F0FC] hover:text-[#042C51]"
                      aria-label={`Download ${document?.name || "document"}`}
                    >
                      <Download size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(document)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      aria-label={`Delete ${document?.name || "document"}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
