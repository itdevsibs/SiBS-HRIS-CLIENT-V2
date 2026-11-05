import { useState } from "react";
import { useNHO } from "../NHOContext";
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Server,
  Sparkles,
  Clock,
  Info,
  X,
  ChevronLeft,
} from "lucide-react";

function NHOITEndorsementView({
  onSelectApplicant,
  onBack,
  onOpenDetails,
  onOpenAttendance,
}) {
  const { applicants, activeApplicant, setSelectedApplicantId, checkITEndorsementEligibility, endorseToIT } = useNHO();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { isEligible, checks } = checkITEndorsementEligibility(activeApplicant);

  const handleConfirmEndorsement = () => {
    endorseToIT(activeApplicant.id);
    setShowConfirmModal(false);
  };

  return (
    <div className="space-y-5 font-jakarta">
      {/* Applicant Details Header Card */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-sibs-border bg-white p-4 shadow-xs sm:p-5">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-xl bg-white border border-sibs-border hover:bg-sibs-surface text-sibs-muted hover:text-sibs-navy transition-colors cursor-pointer"
              title="Back to Dashboard"
              aria-label="Back to NHO Dashboard"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-sibs-navy">{activeApplicant.fullName}</h2>
              <span className="sibs-text-micro font-mono text-sibs-muted bg-sibs-surface px-2 py-0.5 rounded border border-sibs-border/60">
                {activeApplicant.applicantNumber}
              </span>
              <span
                className={
                  activeApplicant.outcome === "Withdrawn"
                    ? "sibs-badge-danger"
                    : activeApplicant.outcome === "Completed Handoff"
                    ? "sibs-badge-success"
                    : activeApplicant.itEndorsed
                    ? "sibs-badge-success"
                    : "sibs-badge-info"
                }
              >
                {activeApplicant.itEndorsed ? `IT: ${activeApplicant.itRequestStatus}` : activeApplicant.outcome}
              </span>
            </div>
            <p className="sibs-text-micro text-sibs-muted mt-0.5">
              {activeApplicant.position} • {activeApplicant.department} ({activeApplicant.account})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Applicant Selector */}
          <div className="flex items-center gap-1.5">
            <span className="sibs-text-micro text-sibs-muted font-bold">Applicant:</span>
            <select
              value={activeApplicant.id}
              onChange={(e) => {
                const found = applicants.find((a) => a.id === e.target.value);
                if (found) {
                  setSelectedApplicantId(found.id);
                  if (onSelectApplicant) onSelectApplicant(found);
                }
              }}
              className="px-2.5 py-1.5 bg-white border border-sibs-border rounded-xl sibs-text-micro font-bold text-sibs-navy hover:border-sibs-orange transition-colors focus:outline-none cursor-pointer"
            >
              {applicants.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName} ({a.applicantNumber})
                </option>
              ))}
            </select>
          </div>

          {onOpenAttendance && (
            <button
              type="button"
              onClick={() => onOpenAttendance(activeApplicant)}
              className="sibs-btn-secondary !text-xs !py-1.5 !px-3"
            >
              Update Attendance / Majors
            </button>
          )}

          {!activeApplicant.itEndorsed || activeApplicant.itRequestStatus === "Needs Correction" ? (
            <button
              type="button"
              disabled={!isEligible}
              onClick={() => setShowConfirmModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activeApplicant.itRequestStatus === "Needs Correction" ? "Re-Endorse to IT" : "Endorse to IT"}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dispatched to IT ({activeApplicant.itRequestStatus})</span>
            </div>
          )}

          {onOpenDetails && (
            <button
              type="button"
              onClick={() => onOpenDetails(activeApplicant)}
              className="sibs-btn-secondary !text-xs !py-1.5 !px-3"
            >
              Applicant Details
            </button>
          )}
        </div>
      </section>

      {/* 9-Point Mandatory Readiness Checklist */}
      <div className="bg-white rounded-2xl border border-sibs-border p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-sibs-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sibs-navy text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-sibs-orange" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-sibs-navy">
                Mandatory 9-Point IT Endorsement Criteria
              </h2>
              <span className="sibs-text-micro text-sibs-muted">
                Candidate: <strong className="text-sibs-navy">{activeApplicant.fullName}</strong>
              </span>
            </div>
          </div>

          <span className={isEligible ? "sibs-badge-success" : "sibs-badge-amber"}>
            {isEligible ? "All 9 Conditions Satisfied" : "Pending Mandatory Conditions"}
          </span>
        </div>

        {/* 9 Checks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {checks.map((chk, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex items-start justify-between gap-2 transition-all ${
                chk.passed
                  ? "bg-green-50/60 border-green-200 text-green-950"
                  : "bg-sibs-surface border-sibs-border text-sibs-muted"
              }`}
            >
              <div>
                <span className="font-extrabold text-xs block text-sibs-navy">{chk.label}</span>
                {idx === 5 && activeApplicant.orientationStatus === "Completed" && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                    Orientation Quiz Score: {activeApplicant.orientationQuizScore ?? 4}/{activeApplicant.orientationQuizTotal ?? 5} ({activeApplicant.orientationQuizPercentage ?? 80}%) · Passed
                  </span>
                )}
                <span className="sibs-text-micro text-sibs-muted block mt-0.5">
                  {chk.passed ? "Condition Verified" : "Action Required"}
                </span>
              </div>
              {chk.passed ? (
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-4 h-4 text-sibs-muted shrink-0 mt-0.5" />
              )}
            </div>
          ))}
        </div>

        {/* Non-Major Exemption Highlight */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3 sibs-text-xs text-blue-950">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block">Non-Major Requirements Rule (Phase 7):</strong>
            Non-major documents (e.g. TOR / College Diploma, SSS E-1, Pag-IBIG MDF) have a 14-day window following physical NHO clearance and <strong>do not prevent IT Endorsement</strong> if the 9 mandatory conditions above are satisfied.
          </div>
        </div>
      </div>

      {/* Generated ID Creation Request Preview */}
      <div className="bg-white rounded-2xl border border-sibs-border p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-sibs-border">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-sibs-navy" />
            <h3 className="text-sm font-extrabold text-sibs-navy">
              Prepared ID Creation Request (Payload for IT Queue)
            </h3>
          </div>
          <span className="sibs-text-micro font-mono text-sibs-muted">
            Status: {activeApplicant.itEndorsed ? activeApplicant.itRequestStatus : "Draft"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-sibs-surface rounded-xl border border-sibs-border">
            <span className="sibs-text-micro text-sibs-muted uppercase font-extrabold block">
              Legal Employee Name
            </span>
            <span className="font-extrabold text-sibs-navy text-xs block mt-1">
              {activeApplicant.fullName}
            </span>
            <span className="sibs-text-micro text-sibs-muted">(Authoritative HRIS Identity)</span>
          </div>

          <div className="p-3 bg-sibs-surface rounded-xl border border-sibs-border">
            <span className="sibs-text-micro text-sibs-muted uppercase font-extrabold block">
              Proposed Username
            </span>
            <span className="font-bold text-sibs-navy text-xs block mt-1 font-mono">
              {activeApplicant.proposedKronosUsername}
            </span>
            <span className="sibs-text-micro text-sibs-muted">(IT Permitted Editable)</span>
          </div>

          <div className="p-3 bg-sibs-surface rounded-xl border border-sibs-border">
            <span className="sibs-text-micro text-sibs-muted uppercase font-extrabold block">
              Assigned Department
            </span>
            <span className="font-extrabold text-sibs-navy text-xs block mt-1">
              {activeApplicant.assignedDepartment}
            </span>
            <span className="sibs-text-micro text-sibs-muted">{activeApplicant.account}</span>
          </div>

          <div className="p-3 bg-sibs-surface rounded-xl border border-sibs-border">
            <span className="sibs-text-micro text-sibs-muted uppercase font-extrabold block">
              Physical Clearance Date
            </span>
            <span className="font-extrabold text-sibs-navy text-xs block mt-1">
              {activeApplicant.clearedDate || "—"}
            </span>
            <span className="sibs-text-micro text-sibs-muted">
              Venue: {activeApplicant.reportingLocation.split(",")[0]}
            </span>
          </div>
        </div>

        {/* Terminal status warning */}
        {(activeApplicant.outcome === "Withdrawn" || activeApplicant.outcome === "Drop-Off") && (
          <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl text-red-950 sibs-text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>Endorsement Blocked:</strong> Candidate is in a terminal status ({activeApplicant.outcome}). Cannot endorse to IT.
            </span>
          </div>
        )}

        {/* Endorse Button */}
        <div className="pt-3 flex items-center justify-between border-t border-sibs-border">
          <span className="sibs-text-micro text-sibs-muted">
            {activeApplicant.itEndorsed && activeApplicant.itRequestStatus !== "Needs Correction"
              ? `Endorsed by ${activeApplicant.itEndorsedBy} on ${activeApplicant.itEndorsedAt}`
              : isEligible
              ? "All 9 mandatory conditions passed. Ready for explicit TA endorsement."
              : "Endorsement locked until all 9 mandatory conditions pass."}
          </span>

          {!activeApplicant.itEndorsed || activeApplicant.itRequestStatus === "Needs Correction" ? (
            <button
              type="button"
              disabled={!isEligible}
              onClick={() => setShowConfirmModal(true)}
              className="sibs-btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              <span>{activeApplicant.itRequestStatus === "Needs Correction" ? "Re-Endorse to IT" : "Endorse to IT"}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Dispatched to IT Queue ({activeApplicant.itRequestStatus})</span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-sibs-border text-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-sibs-navy">Confirm IT Endorsement</h3>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-sibs-muted hover:text-sibs-navy cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sibs-muted leading-relaxed">
              You are about to endorse <strong>{activeApplicant.fullName}</strong> to the IT Queue for Kronos identity creation. All 9 mandatory conditions have been verified.
            </p>

            <div className="p-3 bg-sibs-surface rounded-xl border border-sibs-border sibs-text-micro text-sibs-muted space-y-1">
              <div><strong className="text-sibs-navy">Candidate:</strong> {activeApplicant.fullName}</div>
              <div><strong className="text-sibs-navy">Proposed Username:</strong> {activeApplicant.proposedKronosUsername}</div>
              <div><strong className="text-sibs-navy">Department:</strong> {activeApplicant.assignedDepartment}</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="sibs-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEndorsement}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer transition-colors"
              >
                Confirm &amp; Dispatch to IT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NHOITEndorsementView;
