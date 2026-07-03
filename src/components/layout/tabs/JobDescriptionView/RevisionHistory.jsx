import { History } from "lucide-react";
import React, { useMemo, useState } from "react";

function safeParseJson(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function formatDateTime(value) {
  if (!value) return "—";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRevisionNo(revision = {}, index = 0) {
  return (
    revision.revisionNo ||
    revision.revision_no ||
    revision.versionNo ||
    revision.version_no ||
    revision.currentVersion ||
    revision.current_version ||
    index + 1
  );
}

function getRevisionDate(revision = {}) {
  return (
    revision.createdAt ||
    revision.created_at ||
    revision.reviewedAt ||
    revision.reviewed_at ||
    revision.approvedAt ||
    revision.approved_at ||
    revision.revisedAt ||
    revision.revised_at ||
    ""
  );
}

function getRevisionChanges(revision = {}) {
  const rawChanges =
    revision.changeDetails ||
    revision.change_details ||
    revision.changeDetailsJson ||
    revision.change_details_json ||
    [];

  return safeParseJson(rawChanges, []).filter((change) => {
    if (!change) return false;

    const key = String(change.key || "").trim();
    const type = String(change.type || "").trim();

    return key !== "currentSnapshot" && type !== "revision_snapshot";
  });
}

function getSubmitEntry(changeDetails = []) {
  return changeDetails.find(
    (change) => change?.type === "revision_submit" || change?.key === "revision",
  );
}

function getRevisionBy(revision = {}, changeDetails = []) {
  const submitEntry = getSubmitEntry(changeDetails);

  return (
    revision.revisedBy ||
    revision.revised_by ||
    revision.reviewedBy ||
    revision.reviewed_by ||
    revision.approvedBy ||
    revision.approved_by ||
    submitEntry?.submittedBy ||
    submitEntry?.submitted_by ||
    "—"
  );
}

function getRevisionRemarks(revision = {}, changeDetails = []) {
  const submitEntry = getSubmitEntry(changeDetails);

  return (
    revision.revisionRemarks ||
    revision.revision_remarks ||
    revision.approveRemarks ||
    revision.approve_remarks ||
    submitEntry?.remarks ||
    ""
  );
}

function getChangeOldValue(change = {}) {
  return (
    change.oldValue ??
    change.previousValue ??
    change.previous_value ??
    change.from ??
    ""
  );
}

function getChangeNewValue(change = {}) {
  return (
    change.newValue ??
    change.revisedValue ??
    change.revised_value ??
    change.to ??
    ""
  );
}

function formatChangeValue(value) {
  if (value === null || value === undefined) return "—";

  if (Array.isArray(value)) {
    if (!value.length) return "—";

    return value
      .map((item) => {
        if (typeof item === "string") return item;

        const title = item.title ? `${item.title}: ` : "";
        const description = item.description || "";
        const level = item.level ? ` (${item.level})` : "";

        return `${title}${description}${level}`.trim();
      })
      .filter(Boolean)
      .join("\n\n");
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value || "").trim() || "—";
}

const RevisionHistory = ({ revisionHistory = [], item = {} }) => {
  const [openRevisionId, setOpenRevisionId] = useState(null);

  const revisions = useMemo(() => {
    return Array.isArray(revisionHistory) ? revisionHistory : [];
  }, [revisionHistory]);

  return (
    <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <History size={18} className="text-purple-700" />

        <h3 className="text-sm font-bold text-purple-700">
          Revision History
        </h3>
      </div>

      {revisions.length > 0 ? (
        <div className="space-y-3">
          {revisions.map((revision, index) => {
            const changeDetails = getRevisionChanges(revision);
            const revisionNo = getRevisionNo(revision, index);
            const revisionKey =
              revision.id ||
              revision.revisionId ||
              revision.revision_id ||
              `revision-history-${item.id || item.jdCode}-${index}`;

            const isOpen = openRevisionId === revisionKey;
            const remarks = getRevisionRemarks(revision, changeDetails);

            return (
              <div
                key={revisionKey}
                className="rounded-xl border border-purple-100 bg-white p-4"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenRevisionId((current) =>
                      current === revisionKey ? null : revisionKey,
                    )
                  }
                  className="flex w-full flex-col justify-between gap-2 text-left md:flex-row md:items-center"
                >
                  <div>
                    <p className="text-sm font-extrabold text-purple-700">
                      REV-{revisionNo}
                    </p>

                    <p className="mt-2 text-sm font-semibold text-[#344054]">
                      Revised by:{" "}
                      <span className="font-bold">
                        {getRevisionBy(revision, changeDetails)}
                      </span>
                    </p>

                    <p className="mt-1 text-xs font-bold text-purple-500">
                      {formatDateTime(getRevisionDate(revision))}
                    </p>
                  </div>

                  <span className="text-lg font-extrabold text-purple-500">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {remarks && (
                  <div className="mt-3 rounded-lg border border-purple-100 bg-purple-50 px-3 py-2">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-purple-600">
                      Revision Remarks
                    </p>

                    <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-6 text-[#344054]">
                      {remarks}
                    </p>
                  </div>
                )}

                {isOpen && (
                  <div className="mt-4 space-y-3">
                    {changeDetails.length > 0 ? (
                      changeDetails.map((change, changeIndex) => (
                        <div
                          key={`${revisionKey}-change-${changeIndex}`}
                          className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3"
                        >
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-sm font-extrabold text-[#101828]">
                              {change.label || change.key || "Updated Field"}
                            </p>

                            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-sibs-primary-1">
                              Edited
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="rounded-lg border border-[#D7DEE8] bg-white px-3 py-3">
                              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
                                Previous Value
                              </p>

                              <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-[#667085]">
                                {formatChangeValue(getChangeOldValue(change))}
                              </p>
                            </div>

                            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-3">
                              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#315F8C]">
                                New Value
                              </p>

                              <p className="mt-2 whitespace-pre-line text-sm font-extrabold leading-6 text-sibs-primary-1">
                                {formatChangeValue(getChangeNewValue(change))}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl border border-purple-100 bg-purple-50 p-3 text-sm font-semibold text-purple-700">
                        No detailed field changes recorded.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
