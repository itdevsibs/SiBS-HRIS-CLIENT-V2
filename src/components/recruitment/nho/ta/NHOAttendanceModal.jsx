import { ModalShell, StatusFilterTabs } from "@/components/ui";
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useNHO } from "../NHOContext";
import {
  CalendarDays,
  AlertTriangle,
  Phone,
  Mail
} from "lucide-react";
function NHOAttendanceModal({ isOpen, onClose, applicant }) {
  const {
    markAttendance,
    recordFollowUp,
    rescheduleNHO,
    acceptRescheduledSchedule,
    markDropOff,
    showToast
  } = useNHO();
  const [attendanceChoice, setAttendanceChoice] = useState(applicant.attendance);
  const [isCorrection, setIsCorrection] = useState(applicant.attendance !== "Pending");
  const [correctionReason, setCorrectionReason] = useState("");
  const [followUpMethod, setFollowUpMethod] = useState("Telephone Call");
  const [followUpResult, setFollowUpResult] = useState("No Answer");
  const [followUpRemarks, setFollowUpRemarks] = useState("");
  const [newRescheduleDate, setNewRescheduleDate] = useState("2026-10-19");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleError, setRescheduleError] = useState(null);
  const [dropOffReason, setDropOffReason] = useState("");
  const [noShowReason, setNoShowReason] = useState("");
  const [noShowRemarks, setNoShowRemarks] = useState("");
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("attendance");
  useEffect(() => {
    setAttendanceChoice(applicant.attendance);
    setIsCorrection(applicant.attendance !== "Pending");
    setCorrectionReason("");
    setNoShowReason("");
    setNoShowRemarks("");
  }, [applicant]);
  if (!isOpen) return null;
  const handleSaveAttendance = () => {
    if (attendanceChoice === "Pending") {
      showToast("Please tag the candidate as Show or No Show before saving.", "error");
      return;
    }
    if (!applicant.scheduleAccepted) {
      showToast("Cannot mark attendance: The applicant has not yet accepted the rescheduled NHO invitation.", "error");
      return;
    }
    if (isCorrection && !correctionReason.trim()) {
      showToast("Please provide a mandatory correction reason for audit records.", "error");
      return;
    }
    if (attendanceChoice === "No Show") {
      if (!noShowReason) {
        showToast("Please select a No Show reason from the dropdown.", "error");
        return;
      }
      if (!noShowRemarks.trim()) {
        showToast("Please provide additional remarks explaining the candidate's No Show status.", "error");
        return;
      }
    }
    const result = markAttendance(
      applicant.id,
      attendanceChoice,
      isCorrection ? correctionReason : void 0,
      attendanceChoice === "No Show" ? noShowReason : void 0,
      attendanceChoice === "No Show" ? noShowRemarks : void 0
    );
    if (result.success) onClose();
  };
  const handleRecordFollowUp = () => {
    if (!followUpRemarks.trim()) {
      showToast("Please enter follow-up remarks.", "error");
      return;
    }
    recordFollowUp(applicant.id, {
      method: followUpMethod,
      result: followUpResult,
      remarks: followUpRemarks
    });
    setFollowUpRemarks("");
    setActiveTab("attendance");
  };
  const handleReschedule = () => {
    setRescheduleError(null);
    if (!rescheduleReason.trim()) {
      setRescheduleError("Please provide a reason for rescheduling.");
      return;
    }
    const result = rescheduleNHO(applicant.id, newRescheduleDate, rescheduleReason);
    if (result.success) {
      onClose();
    } else if (result.error) {
      setRescheduleError(result.error);
    }
  };
  const handleDropOff = () => {
    if (!dropOffReason.trim()) {
      showToast("Please provide a drop-off reason.", "error");
      return;
    }
    const res = markDropOff(applicant.id, dropOffReason);
    if (res.success) {
      onClose();
    }
  };
  return <ModalShell
    open={isOpen}
    onClose={onClose}
    icon={CalendarDays}
    title="NHO Attendance Management"
    subtitle={applicant.fullName + " · " + applicant.applicantNumber}
    maxWidth="max-w-2xl"
    zIndex="z-[10020]"
    bodyClassName="p-0 bg-sibs-surface"
    footer={activeTab === "attendance" ? <><button type="button" onClick={onClose} className="sibs-modal-btn-secondary">Cancel</button><button type="button" onClick={handleSaveAttendance} disabled={attendanceChoice === "Pending"} className="sibs-modal-btn-primary">Save Attendance Record</button></> : <button type="button" onClick={onClose} className="sibs-modal-btn-secondary">Close</button>}
  >
    <StatusFilterTabs tabs={[{ id: "attendance", label: "Mark Attendance" }, { id: "followup", label: `Follow-Up Log (${applicant.followUpLogs.length})` }, { id: "reschedule", label: "Reschedule NHO" }]} activeValue={activeTab} onChange={setActiveTab} layoutId="nhoAttendanceTabs" className="flex-wrap !overflow-visible" />
        {activeTab === "attendance" && <div className="p-4 sm:p-5 space-y-5 flex-1">
            {
    /* Rescheduled Acceptance Warning Banner */
  }
            {!applicant.scheduleAccepted && <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <strong className="font-bold">Rescheduled Invitation Pending Acceptance:</strong>
                    <span className="block text-[11px] text-amber-800">
                      Policy requires confirmed acceptance of rescheduled NHO date ({applicant.scheduledNhoDate}) before attendance can be saved.
                    </span>
                  </div>
                </div>
                <button
    type="button"
    onClick={() => acceptRescheduledSchedule(applicant.id)}
    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
  >
                  Accept Invitation
                </button>
              </div>}

            {
    /* Attendance Choice */
  }
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Candidate Attendance on {applicant.scheduledNhoDate}:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
    type="button"
    onClick={() => setAttendanceChoice("Show")}
    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${attendanceChoice === "Show" ? "border-green-500 bg-green-50/70 text-green-950 font-bold ring-2 ring-green-500/20" : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"}`}
  >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-xs font-bold">Show (Attended)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">
                    Candidate attended physical orientation session on site.
                  </p>
                </button>

                <button
    type="button"
    onClick={() => setAttendanceChoice("No Show")}
    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${attendanceChoice === "No Show" ? "border-red-500 bg-red-50/70 text-red-950 font-bold ring-2 ring-red-500/20" : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"}`}
  >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-xs font-bold">No Show (Absent)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">
                    Candidate failed to attend orientation session.
                  </p>
                </button>
              </div>
            </div>

            {
    /* Automatic Portal Invitation Banner (When Show is selected) */
  }
            {attendanceChoice === "Show" ? <div className="border border-green-200 rounded-xl p-4 bg-green-50/70 space-y-3 text-xs text-green-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-green-900">
                    <Mail className="w-4 h-4 text-green-700 shrink-0" />
                    <span>Automatic Temporary Credentials & Check-In Email</span>
                  </div>
                  <button
    type="button"
    onClick={() => setShowEmailPreview((prev) => !prev)}
    className="text-[11px] font-bold text-green-800 hover:text-green-950 underline cursor-pointer"
  >
                    {showEmailPreview ? "Hide Email Preview" : "Preview Dispatched Email"}
                  </button>
                </div>

                <p className="text-[11px] text-green-800 leading-relaxed">
                  Upon saving <strong>Show</strong> attendance, HRIS will immediately proceed to the next step and automatically dispatch an official email to <strong>{applicant.email}</strong> containing their temporary access credentials and instructions for accessing the <strong>NHO materials and check-ins</strong>.
                </p>

                {showEmailPreview && <div className="p-3.5 bg-white rounded-xl border border-green-200 space-y-2 text-[11px] shadow-2xs text-slate-700 font-sans">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-sibs-navy">Subject: Welcome to SiBS! Your NHO Access Credentials & Orientation Instructions</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">Auto-Dispatched</span>
                    </div>
                    <div className="text-slate-600 space-y-1.5 leading-relaxed pt-1">
                      <p>Dear <strong>{applicant.fullName}</strong>,</p>
                      <p>Welcome to SiBS! Your attendance at New Hire Orientation on <strong>{applicant.scheduledNhoDate}</strong> has been confirmed.</p>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-sibs-navy space-y-1">
                        <div>Portal URL: <strong>https://onboarding.internal.sibs.com/portal</strong></div>
                        <div>Candidate ID: <strong>{applicant.applicantNumber}</strong></div>
                        <div>One-Time 24h Retrieval Token: <strong>TOKEN-ACTIVATE-2026</strong></div>
                      </div>
                      <p className="font-semibold text-slate-800">Next Steps & Check-In Instructions:</p>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                        <li>Log in to access your digital <strong>NHO Training Materials & Curriculum Slides</strong>.</li>
                        <li>Complete your daily orientation <strong>Check-Ins and comprehension quiz</strong>.</li>
                        <li>Review and electronically sign the 3 mandatory agreements before IT account provisioning.</li>
                      </ul>
                    </div>
                  </div>}

                <div className="p-2.5 bg-white rounded-lg border border-green-200 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Major requirements (Medical, NBI, PSA, Valid ID) can be uploaded self-service by the candidate.</span>
                  <span className="font-bold text-green-700 shrink-0 ml-2">Next Step Ready</span>
                </div>
              </div> : attendanceChoice === "No Show" ? (
    /* No Show requires both a dropdown reason and additional remarks. */
    <div className="p-4 bg-red-50/80 border border-red-200 rounded-xl text-red-950 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-red-900">
                  <Phone className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Mandatory No Show Reason & Remarks Required:</span>
                </div>
                
                <p className="text-[11px] text-red-800 leading-relaxed">
                  Candidate failed to attend the scheduled NHO session. Temporary portal access will not be issued. You must record a specific reason and detailed remarks for audit logging.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-red-950 block">
                    No Show Reason <span className="text-red-600 font-black">*</span>
                  </label>
                  <select
      value={noShowReason}
      onChange={(e) => setNoShowReason(e.target.value)}
      className="w-full p-2.5 bg-white border border-red-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
    >
                    <option value="" disabled>Select a No Show reason...</option>
                    <option value="Unreachable / No Response">Unreachable / No Response</option>
                    <option value="Personal / Family Emergency">Personal / Family Emergency</option>
                    <option value="Transportation / Commute Issue">Transportation / Commute Issue</option>
                    <option value="Medical / Health Concern">Medical / Health Concern</option>
                    <option value="Considering Other Offers / Cold Feet">Considering Other Offers / Cold Feet</option>
                    <option value="Schedule Conflict / Requested Later Batch">Schedule Conflict / Requested Later Batch</option>
                    <option value="Other Reason">Other Reason</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-red-950 block">
                    Additional Remarks & Outreach Notes <span className="text-red-600 font-black">*</span>
                  </label>
                  <textarea
      rows={2}
      value={noShowRemarks}
      onChange={(e) => setNoShowRemarks(e.target.value)}
      placeholder="e.g. Called mobile number at 09:30 AM; left voicemail. Candidate replied via SMS citing family emergency, requested reschedule..."
      className="w-full p-2.5 bg-white border border-red-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
    />
                  {!noShowRemarks.trim() && <span className="text-[10px] text-red-600 font-medium">Remarks are mandatory before saving No Show status.</span>}
                </div>
              </div>
  ) : <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
                Select <strong>Show</strong> or <strong>No Show</strong> to tag the candidate's NHO attendance.
              </p>}

            {
    /* Mandatory Correction Reason (Only shown when correcting an existing saved record) */
  }
            {isCorrection && <div className="space-y-1.5 p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl">
                <label className="text-xs font-bold text-amber-950 block">
                  Mandatory Correction Reason (Audit Record):
                </label>
                <input
    type="text"
    value={correctionReason}
    onChange={(e) => setCorrectionReason(e.target.value)}
    placeholder="e.g. Corrected attendance status after late arrival verification or attendance roster reconciliation..."
    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sibs-navy"
  />
              </div>}

            {
    /* Attendance correction history display if exists */
  }
            {applicant.auditLogs.filter((l) => l.action.includes("Attendance")).length > 0 && <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                  Attendance History
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {applicant.auditLogs.filter((l) => l.action.includes("Attendance")).map((log) => <div key={log.id} className="text-[11px] text-slate-600 flex items-start justify-between">
                        <span>{log.action}</span>
                        <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                      </div>)}
                </div>
              </div>}
          </div>}

        {
    /* Tab 2: Follow-Up Log */
  }
        {activeTab === "followup" && <div className="p-4 sm:p-5 space-y-4 flex-1 text-xs">
            <div className="bg-sibs-surface p-3.5 rounded-xl border border-sibs-border space-y-3">
              <span className="font-bold text-sibs-navy block text-xs uppercase tracking-wider">
                Log New Follow-Up Attempt
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Contact Method
                  </label>
                  <select
    value={followUpMethod}
    onChange={(e) => setFollowUpMethod(e.target.value)}
    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
  >
                    <option value="Telephone Call">Telephone Call</option>
                    <option value="SMS">SMS Message</option>
                    <option value="Email">Official Email</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Outcome / Result
                  </label>
                  <select
    value={followUpResult}
    onChange={(e) => setFollowUpResult(e.target.value)}
    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
  >
                    <option value="Reached - Agreed to Reschedule">Reached - Agreed to Reschedule</option>
                    <option value="Reached - Declining / Withdrawn">Reached - Declining / Withdrawn</option>
                    <option value="No Answer">No Answer / Ringing Only</option>
                    <option value="Busy / Unreachable">Busy / Out of Coverage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Follow-Up Remarks & Notes
                </label>
                <textarea
    rows={2}
    value={followUpRemarks}
    onChange={(e) => setFollowUpRemarks(e.target.value)}
    placeholder="Detail conversation, reason for missing session, or next agreed follow-up timeline..."
    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none"
  />
              </div>

              <button
    type="button"
    onClick={handleRecordFollowUp}
    className="px-3 py-1.5 rounded-lg bg-sibs-navy text-white font-bold text-xs hover:bg-sibs-tertiary-2 transition-colors cursor-pointer"
  >
                Save Follow-Up Entry
              </button>
            </div>

            {
    /* Existing Logs */
  }
            <div>
              <span className="font-bold text-slate-700 block mb-2 text-xs">
                Follow-Up History ({applicant.followUpLogs.length} attempts recorded):
              </span>
              {applicant.followUpLogs.length === 0 ? <div className="text-slate-400 text-xs italic p-3 text-center bg-slate-50 rounded-xl">
                  No outreach attempts recorded yet.
                </div> : <div className="space-y-2">
                  {applicant.followUpLogs.map((log) => <div key={log.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-sibs-navy">{log.method} • {log.result}</span>
                        <span className="text-slate-400">{log.date}</span>
                      </div>
                      <p className="text-slate-600 text-xs">{log.remarks}</p>
                      <span className="text-[10px] text-slate-400 block">Logged by {log.attemptedBy}</span>
                    </div>)}
                </div>}
            </div>

            {
    /* Drop-Off Option */
  }
            <div className="pt-3 border-t border-slate-200">
              <span className="text-red-700 font-bold block mb-1">Mark as Drop-Off (Case Closure):</span>
              <p className="text-[11px] text-slate-500 mb-2">
                Only use if applicant is uncontactable after repeated verified outreach attempts.
              </p>
              <div className="flex gap-2">
                <input
    type="text"
    value={dropOffReason}
    onChange={(e) => setDropOffReason(e.target.value)}
    placeholder="Reason for marking Drop-Off..."
    className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
  />
                <button
    type="button"
    onClick={handleDropOff}
    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
  >
                  Confirm Drop-Off
                </button>
              </div>
            </div>
          </div>}

        {
    /* Tab 3: Reschedule NHO */
  }
        {activeTab === "reschedule" && <div className="p-4 sm:p-5 space-y-4 flex-1 text-xs">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-950">
              <strong className="block font-bold mb-1">7-Calendar-Day Preparation Rule (Non-Negotiable):</strong>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                SiBS HRIS policy strictly validates that the rescheduled NHO date must be at least <strong>seven (7) calendar days</strong> from the invitation dispatch date (Asia/Manila calendar).
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Proposed New NHO Date:
                </label>
                <input
    type="date"
    value={newRescheduleDate}
    onChange={(e) => setNewRescheduleDate(e.target.value)}
    className="p-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-sibs-navy"
  />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Notice date: Oct 09, 2026. Earliest allowable date: Oct 16, 2026.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Reschedule Reason:
                </label>
                <textarea
    rows={2}
    value={rescheduleReason}
    onChange={(e) => setRescheduleReason(e.target.value)}
    placeholder="e.g. Applicant requested later batch date, rescheduled with agreed notice..."
    className="w-full p-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sibs-navy"
  />
              </div>

              {rescheduleError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{rescheduleError}</span>
                </div>}
            </div>

            <div className="pt-2 flex justify-end">
              <button
    type="button"
    onClick={handleReschedule}
    className="px-4 py-2 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover text-white font-bold text-xs shadow-xs cursor-pointer"
  >
                Validate & Confirm Reschedule
              </button>
            </div>
          </div>}

        {
    /* Footer */
  }
  </ModalShell>;
}
export {
  NHOAttendanceModal as default
};
