import { History } from "lucide-react";
import React from "react";

const RevisionHistory = ({ revisionHistory, item }) => {
  return (
    <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <History size={18} className="text-purple-700" />

        <h3 className="text-sm font-bold text-purple-700">Revision History</h3>
      </div>

      {revisionHistory.length > 0 ? (
        <div className="space-y-3">
          {revisionHistory.map((revision, index) => (
            <div
              key={
                revision.revisionId ||
                `revision-history-${item.id || item.jdCode}-${index}`
              }
              className="rounded-xl border border-purple-100 bg-white p-4"
            >
              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                <p className="text-sm font-bold text-purple-700">
                  {revision.revisionId || `REV-${index + 1}`}
                </p>

                <p className="text-xs font-bold text-purple-500">
                  {revision.revisedAt || "—"}
                </p>
              </div>

              <p className="mt-2 text-sm font-semibold text-[#344054]">
                Revised by:{" "}
                <span className="font-bold">{revision.revisedBy || "—"}</span>
              </p>

              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#344054]">
                {revision.revisionRemarks || "—"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-purple-100 bg-white p-4 text-sm font-semibold text-purple-700">
          No revision history yet.
        </p>
      )}
    </div>
  );
};

export default RevisionHistory;
