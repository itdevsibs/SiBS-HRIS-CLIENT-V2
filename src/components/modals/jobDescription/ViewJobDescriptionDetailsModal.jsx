import { History, PencilLine, X } from "lucide-react";
import InfoBox from "../../layout/InfoBox";

export default function ViewJobDescriptionDetailsModal({
  open,
  item,
  onClose,
  onOpenRevision,
}) {
  function normalizeJdStatus(status) {
    if (status === "New JD") return "New Job Description";
    return status || "New Job Description";
  }

  function getJdStatusClass(status) {
    switch (normalizeJdStatus(status)) {
      case "Existing":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "For Revision":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "New Job Description":
        return "border-blue-200 bg-blue-50 text-blue-700";
      default:
        return "border-gray-200 bg-gray-50 text-gray-600";
    }
  }

  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (!open || !item) return null;

  const revisionHistory = Array.isArray(item.revisionHistory)
    ? item.revisionHistory
    : [];

  const latestRevision = revisionHistory.length > 0 ? revisionHistory[0] : null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-job-description-modal-title"
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2
              id="view-job-description-modal-title"
              className="text-lg font-bold text-sibs-primary-1 sm:text-xl"
            >
              Job Description Details
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              JD status and linked hiring requirement.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[#101828] sm:text-xl">
                      {item.roleTitle || "—"}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      {item.account || "—"} / {item.department || "—"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getJdStatusClass(
                          item.jdStatus
                        )}`}
                      >
                        {normalizeJdStatus(item.jdStatus)}
                      </span>

                      {latestRevision && (
                        <span className="inline-flex rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                          Revised by {latestRevision.revisedBy} on{" "}
                          {formatDate(latestRevision.revisedDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      JD Code
                    </p>

                    <p className="mt-1 text-2xl font-bold text-sibs-primary-1">
                      {item.jdCode || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {[
                ["Job Summary / Description", item.description || "—"],
                ["Key Responsibilities", item.responsibilities || "—"],
                ["Qualifications / Requirements", item.qualifications || "—"],
                ["Remarks", item.remarks || "No remarks provided."],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
                >
                  <h3 className="text-sm font-bold text-[#101828]">{label}</h3>

                  <p className="mt-3 whitespace-pre-line rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                    {value}
                  </p>
                </div>
              ))}

              <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <History size={18} className="text-purple-700" />

                  <h3 className="text-sm font-bold text-purple-700">
                    Revision History
                  </h3>
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
                          <span className="font-bold">
                            {revision.revisedBy || "—"}
                          </span>
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
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">JD Summary</h3>

                <div className="mt-4 space-y-3">
                  <InfoBox label="JD Code" value={item.jdCode} />
                  <InfoBox label="Account" value={item.account} />
                  <InfoBox label="Department" value={item.department} />
                  <InfoBox
                    label="Linked Hiring Requirement"
                    value={item.linkedHiringRequirement}
                  />
                  <InfoBox label="Owner" value={item.owner} />
                  <InfoBox label="Requested By" value={item.requestedBy} />
                  <InfoBox
                    label="Date Requested"
                    value={formatDate(item.dateRequested)}
                  />
                  <InfoBox
                    label="Last Updated"
                    value={formatDate(item.lastUpdated)}
                  />

                  {latestRevision && (
                    <>
                      <InfoBox
                        label="Latest Revised By"
                        value={latestRevision.revisedBy}
                      />
                      <InfoBox
                        label="Latest Revised Date"
                        value={formatDate(latestRevision.revisedDate)}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Connection Rule
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  When JD Status is Existing, the role can proceed to sourcing
                  and weekly hiring plan execution.
                </p>
              </div>

              {normalizeJdStatus(item.jdStatus) === "For Revision" && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                  <h3 className="text-sm font-bold text-amber-700">
                    Revision Required
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-amber-700/90">
                    This job description needs revision before it can be treated
                    as sourcing-ready.
                  </p>

                  <button
                    type="button"
                    onClick={() => onOpenRevision(item)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700"
                  >
                    <PencilLine size={16} />
                    Update Revision and Tag as Existing
                  </button>
                </div>
              )}

              {latestRevision && (
                <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
                  <h3 className="text-sm font-bold text-purple-700">
                    Latest Revision Line
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-purple-700/90">
                    Revised by{" "}
                    <span className="font-bold">
                      {latestRevision.revisedBy || "—"}
                    </span>{" "}
                    on{" "}
                    <span className="font-bold">
                      {formatDate(latestRevision.revisedDate)}
                    </span>
                    .
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[var(--sibs-primary-1)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}