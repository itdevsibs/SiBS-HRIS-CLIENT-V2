import { useLayoutEffect, useRef, useState } from "react";
import { AlertTriangle, Eye } from "lucide-react";
import Details from "../../layout/tabs/JobDescriptionView/Details";
import { normalizeJdStatus } from "../../../lib/utils/NormalizeJDStatus";
import Approvals from "../../layout/tabs/JobDescriptionView/Approvals";
import RevisionHistory from "../../layout/tabs/JobDescriptionView/RevisionHistory";
import LinkedERCases from "../../layout/tabs/JobDescriptionView/LinkedERCases";

const detailTabs = [
  "Details",
  "Approvals",
  "Revision History",
  "Linked ER Cases",
];

export default function ViewJobDescriptionDetailsModal({
  open,
  item,
  onClose,
}) {
  const [activeDetailTab, setActiveDetailTab] = useState("Details");
  const [revisionComments, setRevisionComments] = useState([]);
  const [hasEditedChanges, setHasEditedChanges] = useState(false);
  const [editedChangeDetails, setEditedChangeDetails] = useState([]);
  const [showEditedChanges, setShowEditedChanges] = useState(false);

  const tabRefs = useRef({});
  const [tabIndicator, setTabIndicator] = useState({
    left: 0,
    width: 0,
  });

  const hasRevisionComments = revisionComments.length > 0;

  const primaryButtonLabel = hasRevisionComments
    ? "Save"
    : hasEditedChanges
      ? "Save as New Version"
      : "Approve";

  const primaryButtonTitle = hasRevisionComments
    ? "Save this job description as tagged for revision."
    : hasEditedChanges
      ? "Save the edited job description as a new version."
      : "Approve job description.";

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

  useLayoutEffect(() => {
    const activeButton = tabRefs.current[activeDetailTab];

    if (!activeButton) return;

    setTabIndicator({
      left: activeButton.offsetLeft,
      width: activeButton.offsetWidth,
    });
  }, [activeDetailTab, open]);

  if (!open || !item) return null;

  const jdTitle = `${item.roleTitle || "Job Description"} - Version ${
    item.version || item.jdVersion || item.currentVersion || "2.0"
  }`;

  const revisionHistory = Array.isArray(item.revisionHistory)
    ? item.revisionHistory
    : [];

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
        <div className="border-b border-gray-200 px-5 pt-6 sm:px-6">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-sibs-primary-1/80">
                Job Description Overview
              </p>

              <h2
                id="view-job-description-modal-title"
                className="mt-1 min-w-0 text-lg font-extrabold text-sibs-primary-1 sm:text-2xl"
              >
                {jdTitle}
              </h2>

              <p className="mt-1 text-sm font-semibold text-[#475467]">
                {item.department || "—"} • {item.account || "—"}
              </p>
            </div>

            <span
              className={`w-fit shrink-0 rounded-lg px-4 py-3 text-xs font-bold ${getJdStatusClass(
                item.jdStatus,
              )}`}
            >
              {normalizeJdStatus(item.jdStatus)}
            </span>
          </div>

          <div className="relative flex gap-8 overflow-x-auto text-sm font-bold text-[#344054]">
            <span
              className="absolute bottom-0 h-[2px] rounded-full bg-blue-500 transition-all duration-300 ease-in-out"
              style={{
                left: `${tabIndicator.left}px`,
                width: `${tabIndicator.width}px`,
              }}
            />

            {detailTabs.map((tab) => {
              const isActive = activeDetailTab === tab;

              return (
                <button
                  key={tab}
                  ref={(el) => {
                    tabRefs.current[tab] = el;
                  }}
                  type="button"
                  onClick={() => setActiveDetailTab(tab)}
                  className={`relative z-10 whitespace-nowrap px-4 pb-3 transition ${
                    isActive
                      ? "text-blue-600"
                      : "text-[#344054] hover:text-blue-600"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeDetailTab === "Details" && (
            <Details
              item={item}
              revisionComments={revisionComments}
              setRevisionComments={setRevisionComments}
              hasEditedChanges={hasEditedChanges}
              onEditedChange={setHasEditedChanges}
              editedChangeDetails={editedChangeDetails}
              setEditedChangeDetails={setEditedChangeDetails}
            />
          )}

          {activeDetailTab === "Approvals" && <Approvals />}

          {activeDetailTab === "Revision History" && (
            <RevisionHistory revisionHistory={revisionHistory} item={item} />
          )}

          {activeDetailTab === "Linked ER Cases" && <LinkedERCases />}
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {hasRevisionComments && (
              <div className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm font-extrabold text-amber-700">
                <AlertTriangle size={16} />
                Tagged for revision
              </div>
            )}

            {!hasRevisionComments && hasEditedChanges && (
              <>
                <div className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 text-sm font-extrabold text-sibs-primary-1">
                  <AlertTriangle size={16} />
                  New version changes
                </div>

                <button
                  type="button"
                  onClick={() => setShowEditedChanges(true)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D7DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:border-sibs-primary-1 hover:bg-[#F8FAFC] active:scale-[0.98]"
                >
                  <Eye size={16} />
                  View Changes
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:border-sibs-primary-1 hover:bg-[#F8FAFC] active:scale-[0.98]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onClose}
              title={
                hasRevisionComments
                  ? "Save this job description as tagged for revision."
                  : hasEditedChanges
                    ? "Save the edited job description as a new version."
                    : "Approve job description."
              }
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-5 text-sm font-extrabold text-white shadow-sm transition active:scale-[0.98] ${
                hasRevisionComments
                  ? "bg-sibs-primary-2 hover:opacity-90"
                  : "bg-sibs-primary-1 hover:opacity-90"
              }`}
            >
              {hasRevisionComments
                ? "Save"
                : hasEditedChanges
                  ? "Save as New Version"
                  : "Approve"}
            </button>
          </div>
        </div>
      </div>

      {showEditedChanges && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#E6ECF2] px-5 py-4">
              <div>
                <h3 className="text-base font-extrabold text-[#101828]">
                  Edited Changes
                </h3>

                <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                  Review the fields that will be saved as a new version.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowEditedChanges(false)}
                className="rounded-lg px-3 py-1 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
              >
                Close
              </button>
            </div>

            <div className="max-h-[60dvh] overflow-y-auto p-5">
              {editedChangeDetails.length > 0 ? (
                <div className="space-y-3">
                  {editedChangeDetails.map((change) => (
                    <div
                      key={change.key}
                      className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                    >
                      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h4 className="text-sm font-extrabold text-[#101828]">
                          {change.label}
                        </h4>

                        <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-sibs-primary-1">
                          Edited
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-[#E6ECF2] bg-white p-3">
                          <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
                            Previous Value
                          </p>

                          <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-[#667085]">
                            {change.oldValue || "—"}
                          </p>
                        </div>

                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                          <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
                            New Value
                          </p>

                          <p className="mt-2 whitespace-pre-line text-sm font-bold leading-6 text-sibs-primary-1">
                            {change.newValue || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-6 text-center">
                  <p className="text-sm font-semibold text-sibs-tertiary-5">
                    No edited changes detected.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-[#E6ECF2] bg-[#F8FAFC] px-5 py-4">
              <button
                type="button"
                onClick={() => setShowEditedChanges(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
