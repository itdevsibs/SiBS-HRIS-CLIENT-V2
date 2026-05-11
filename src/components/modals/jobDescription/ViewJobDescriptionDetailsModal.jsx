import { useLayoutEffect, useRef, useState } from "react";
import { History, PencilLine } from "lucide-react";
import InfoBox from "../../layout/InfoBox";
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

  const tabRefs = useRef({});
  const [tabIndicator, setTabIndicator] = useState({
    left: 0,
    width: 0,
  });

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

  // const latestRevision = revisionHistory.length > 0 ? revisionHistory[0] : null;

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
          {activeDetailTab === "Details" && <Details item={item} />}

          {activeDetailTab === "Approvals" && <Approvals />}

          {activeDetailTab === "Revision History" && (
            <RevisionHistory revisionHistory={revisionHistory} item={item} />
          )}

          {activeDetailTab === "Linked ER Cases" && <LinkedERCases />}
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-sibs-primary-1 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
