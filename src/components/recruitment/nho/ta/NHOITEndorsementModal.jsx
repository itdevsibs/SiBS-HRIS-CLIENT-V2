import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import NHOITEndorsementView from "./NHOITEndorsementView";

function NHOITEndorsementModal({ applicant, onClose, onOpenDetails, onOpenAttendance }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-[2px] sm:p-6 font-jakarta"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`IT endorsement: ${applicant.fullName}`}
        className="flex h-[min(92dvh,920px)] w-full max-w-[1190px] flex-col overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-2xl"
      >
        <div className="h-[3px] shrink-0 bg-sibs-orange" />
        <header className="flex shrink-0 items-center justify-between gap-3 bg-sibs-navy px-4 py-4 text-white sm:px-6">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-white">IT Endorsement Review</h2>
            <p className="mt-1 truncate text-xs text-blue-100">
              {applicant.fullName} · {applicant.applicantNumber} · Nine-point readiness verification
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white hover:bg-white/15 cursor-pointer"
            aria-label="Close IT endorsement"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto bg-sibs-surface p-4 sm:p-6 sibs-scrollbar">
          <NHOITEndorsementView
            onSelectApplicant={() => {}}
            onOpenDetails={onOpenDetails}
            onOpenAttendance={onOpenAttendance}
          />
        </div>
        <footer className="flex shrink-0 items-center justify-end border-t border-sibs-border bg-white px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="sibs-btn-primary !text-xs !py-2 !px-4"
          >
            Close Review
          </button>
        </footer>
      </section>
    </div>
  );
}

export default NHOITEndorsementModal;
