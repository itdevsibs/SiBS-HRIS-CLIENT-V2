import { useState } from "react";
import { useNHO } from "../NHOContext";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Check,
  MapPin,
  Sparkles,
  Info,
} from "lucide-react";
import SearchInput from "@/components/ui/SearchInput";

function NHOWFMDashboard({ subTab = "queue", onSubTabChange }) {
  const {
    applicants,
    activeApplicant,
    setSelectedApplicantId,
    wfmConfirmSeatAssignment,
    showToast,
  } = useNHO();

  const [selectedAppId, setSelectedAppId] = useState(activeApplicant?.id || "");
  const [selectedWing, setSelectedWing] = useState("Left Wing");
  const [seatNumberInput, setSeatNumberInput] = useState("");
  const [remarksInput, setRemarksInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const wfmQueue = applicants.filter((a) => a.itRequestStatus === "Completed" && !!a.officialKronosId);
  const selectedApp = applicants.find((a) => a.id === selectedAppId) || wfmQueue[0] || activeApplicant;

  const handleSelectApp = (app) => {
    setSelectedAppId(app.id);
    setSelectedApplicantId(app.id);
    setSelectedWing(app.wfmProductionWing || "Left Wing");
    setSeatNumberInput(app.wfmSeatNumber || "");
    setRemarksInput(app.wfmRemarks || "");
  };

  const handleConfirmAssignment = (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    const res = wfmConfirmSeatAssignment(
      selectedApp.id,
      selectedWing,
      seatNumberInput,
      remarksInput
    );
    if (res.success) {
      setSeatNumberInput("");
    }
  };

  const filteredQueue = wfmQueue.filter((app) => {
    if (statusFilter === "Pending" && app.wfmStatus === "Assigned") return false;
    if (statusFilter === "Assigned" && app.wfmStatus !== "Assigned") return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.fullName.toLowerCase().includes(q) ||
      app.applicantNumber.toLowerCase().includes(q) ||
      (app.officialKronosId && app.officialKronosId.toLowerCase().includes(q)) ||
      app.department.toLowerCase().includes(q) ||
      app.account.toLowerCase().includes(q) ||
      (app.wfmSeatNumber && app.wfmSeatNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 font-jakarta">
      {/* Walkthrough Preset Action */}
      <div className="flex flex-wrap items-center justify-end gap-4">
        {selectedApp && selectedApp.id === "nho-app-01" && (
          <button
            type="button"
            onClick={() => {
              setSelectedWing("Left Wing");
              setSeatNumberInput("LW-012");
              setRemarksInput("Standard Fintech shift workstation near Team Lead bay.");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-sibs-orange border border-sibs-orange/30 font-bold sibs-text-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Walkthrough Preset (Left Wing / LW-012)</span>
          </button>
        )}
      </div>

      {/* Sequential Workflow Indicator Banner */}
      <div className="p-3.5 bg-sibs-surface border border-sibs-border rounded-xl flex items-center justify-between gap-3 sibs-text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold text-sibs-navy">Workflow Progression:</span>
          <span className="flex items-center gap-1.5 font-semibold text-sibs-muted">
            <span className="px-2 py-0.5 rounded bg-sibs-border/60 text-sibs-navy sibs-text-micro font-bold">
              1. QDS (Materials & Trainer)
            </span>
            <span>→</span>
            <span className="px-2 py-0.5 rounded bg-sibs-border/60 text-sibs-navy sibs-text-micro font-bold">
              2. Trainer (Acceptance)
            </span>
            <span>→</span>
            <span className="px-2 py-0.5 rounded bg-sibs-orange text-white sibs-text-micro font-extrabold shadow-2xs">
              3. WFM (Seat Assignment)
            </span>
          </span>
        </div>
        <div className="sibs-text-micro text-sibs-muted hidden md:block">
          Complete QDS → Trainer → WFM sequence before HR handoff acceptance.
        </div>
      </div>

      {/* Main Grid: Queue on Left, Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Queue Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-sibs-border shadow-xs overflow-hidden flex flex-col">
          {/* Table Header & Controls */}
          <div className="p-4 border-b border-sibs-border space-y-3 bg-sibs-surface/50">
            <div className="flex items-center justify-between">
              <span className="sibs-text-xs font-extrabold text-sibs-navy uppercase tracking-wider">
                Production Seating Queue ({wfmQueue.length})
              </span>
              <span className="sibs-text-micro text-sibs-muted font-medium">
                Forwarded from IT ID Creation
              </span>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex-1 min-w-[200px]">
                <SearchInput
                  value={searchQuery}
                  onChange={(val) => setSearchQuery(typeof val === "string" ? val : val?.target?.value || "")}
                  placeholder="Search candidate, SIBS ID, Kronos ID, or seat..."
                  inputClassName="!h-8.5 text-xs"
                />
              </div>

              <div className="flex items-center gap-1 bg-sibs-surface p-1 rounded-xl border border-sibs-border text-xs">
                {["All", "Pending", "Assigned"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setStatusFilter(tab)}
                    className={`px-2.5 py-1 rounded-lg font-bold sibs-text-micro transition-colors cursor-pointer ${
                      statusFilter === tab
                        ? "bg-sibs-navy text-white shadow-xs"
                        : "text-sibs-muted hover:text-sibs-navy"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-sibs-surface border-b border-sibs-border text-sibs-muted uppercase tracking-wider sibs-text-micro font-extrabold">
                  <th className="py-2.5 px-3">Employee Name</th>
                  <th className="py-2.5 px-3">SIBS ID</th>
                  <th className="py-2.5 px-3">Department / Account</th>
                  <th className="py-2.5 px-3">Kronos ID</th>
                  <th className="py-2.5 px-3">Trainer Status</th>
                  <th className="py-2.5 px-3">Wing</th>
                  <th className="py-2.5 px-3">Workstation</th>
                  <th className="py-2.5 px-3">WFM Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sibs-border">
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-sibs-muted italic">
                      No candidates currently matching filter in WFM Seating Queue. Complete IT Kronos provisioning first.
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((app) => {
                    const isSelected = app.id === selectedApp?.id;
                    const isAssigned = app.wfmStatus === "Assigned";
                    return (
                      <tr
                        key={app.id}
                        className={`hover:bg-sibs-surface/80 transition-colors ${
                          isSelected ? "bg-orange-50/50" : ""
                        }`}
                      >
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => handleSelectApp(app)}
                            className="font-bold text-sibs-navy hover:text-sibs-orange text-left cursor-pointer"
                          >
                            {app.fullName}
                          </button>
                        </td>
                        <td className="py-3 px-3 font-mono sibs-text-micro font-semibold text-sibs-muted">
                          {app.applicantNumber}
                        </td>
                        <td className="py-3 px-3 text-sibs-navy">
                          <span className="block font-semibold">{app.department}</span>
                          <span className="sibs-text-micro text-sibs-muted">{app.account}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 sibs-text-micro">
                            {app.officialKronosId || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {app.trainerStatus === "Accepted" ? (
                            <span className="sibs-badge-success inline-flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Accepted</span>
                            </span>
                          ) : app.trainerStatus === "Unable to Accept" ? (
                            <span className="sibs-badge-danger inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Declined</span>
                            </span>
                          ) : (
                            <span className="sibs-badge-amber inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Awaiting Trainer</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-sibs-navy font-medium">
                          {app.wfmProductionWing || "—"}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-sibs-navy">
                          {app.wfmSeatNumber || "—"}
                        </td>
                        <td className="py-3 px-3">
                          <span className={isAssigned ? "sibs-badge-success inline-flex items-center gap-1" : "sibs-badge-amber inline-flex items-center gap-1"}>
                            {isAssigned ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Assigned</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" />
                                <span>Pending WFM</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleSelectApp(app)}
                            className={`px-2.5 py-1 rounded-lg font-bold sibs-text-micro transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-sibs-navy text-white"
                                : isAssigned
                                ? "sibs-btn-secondary !py-1 !px-2.5"
                                : "sibs-btn-primary !py-1 !px-2.5"
                            }`}
                          >
                            {isAssigned ? "View / Edit" : "Assign Seat"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: WFM Seat Assignment Form & Details */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-sibs-border shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 bg-sibs-surface border-b border-sibs-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sibs-orange" />
              <span className="font-extrabold text-sibs-navy sibs-text-xs uppercase tracking-wider">
                Production Floor Seat Assignment Form
              </span>
            </div>
            {selectedApp && (
              <span className={selectedApp.wfmStatus === "Assigned" ? "sibs-badge-success" : "sibs-badge-amber"}>
                {selectedApp.wfmStatus}
              </span>
            )}
          </div>

          {!selectedApp ? (
            <div className="p-8 text-center text-sibs-muted italic sibs-text-xs">
              Select an endorsed candidate from the queue to assign a production workstation.
            </div>
          ) : (
            <form onSubmit={handleConfirmAssignment} className="p-6 space-y-5 text-xs flex-1 flex flex-col justify-between">
              <div className="space-y-5">
                {/* Read-Only Employee Identity */}
                <div className="p-4 bg-sibs-surface border border-sibs-border rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="sibs-text-micro text-sibs-muted font-extrabold uppercase tracking-wider block">
                        Candidate / Employee
                      </span>
                      <h3 className="sibs-text-sm font-extrabold text-sibs-navy">{selectedApp.fullName}</h3>
                    </div>
                    <span className="font-mono sibs-text-micro font-bold text-sibs-muted bg-white px-2 py-0.5 rounded border border-sibs-border">
                      {selectedApp.applicantNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sibs-text-xs pt-2 border-t border-sibs-border">
                    <div>
                      <span className="text-sibs-muted block sibs-text-micro font-medium">Department:</span>
                      <span className="font-bold text-sibs-navy">{selectedApp.department}</span>
                    </div>
                    <div>
                      <span className="text-sibs-muted block sibs-text-micro font-medium">Account:</span>
                      <span className="font-bold text-sibs-navy">{selectedApp.account}</span>
                    </div>
                    <div>
                      <span className="text-sibs-muted block sibs-text-micro font-medium">Site Location:</span>
                      <span className="font-bold text-sibs-navy">{selectedApp.reportingLocation}</span>
                    </div>
                    <div>
                      <span className="text-sibs-muted block sibs-text-micro font-medium">Official Kronos ID:</span>
                      <span className="font-mono font-bold text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 inline-block mt-0.5">
                        {selectedApp.officialKronosId || "Pending IT"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Validation Note */}
                {!selectedApp.officialKronosId && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-950 sibs-text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      IT account provisioning must be completed with an official Kronos ID before production workstation assignment.
                    </span>
                  </div>
                )}

                {/* Step 2 Prerequisites & Trainer Status Indicator */}
                {selectedApp.trainerStatus === "Accepted" ? (
                  <div className="p-3 bg-green-50/80 border border-green-200 rounded-xl text-green-900 sibs-text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      <div>
                        <span className="font-bold">Step 2 Complete: Trainer Accepted</span>
                        <div className="sibs-text-micro text-green-800">
                          {selectedApp.trainerAcceptedBy || selectedApp.assignedTrainerName} accepted responsibility. Workstation allocation is active.
                        </div>
                      </div>
                    </div>
                    <span className="sibs-badge-success">
                      Ready for Seating
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-900 sibs-text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 text-sibs-info shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Workflow Sequence (QDS → Trainer → WFM):</span>
                      <p className="sibs-text-micro text-blue-800 mt-0.5 leading-relaxed">
                        Trainer acceptance is currently pending ({selectedApp.assignedTrainerName || "Trainer Unassigned"}). You may pre-assign the workstation now; once Trainer accepts, the full post-IT handoff package will be ready for HR acceptance.
                      </p>
                    </div>
                  </div>
                )}

                {/* Field 1: Production Floor Wing */}
                <div className="space-y-1.5">
                  <label className="block sibs-text-xs font-bold text-sibs-navy">
                    Field 1 — Production Floor Wing <span className="text-red-500">*</span>
                  </label>
                  <p className="sibs-text-micro text-sibs-muted">
                    Select the designated production floor wing for this account.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {["Left Wing", "Right Wing"].map((wing) => {
                      const isWingSelected = selectedWing === wing;
                      const isLocked = selectedApp.handoffStatus === "Accepted" || selectedApp.outcome === "Completed Handoff";
                      return (
                        <label
                          key={wing}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                            isLocked
                              ? "cursor-not-allowed opacity-70 bg-sibs-surface border-sibs-border"
                              : "cursor-pointer " +
                                (isWingSelected
                                  ? "bg-orange-50/70 border-sibs-orange text-sibs-navy font-bold shadow-xs"
                                  : "bg-white border-sibs-border hover:bg-sibs-surface text-sibs-navy font-medium")
                          }`}
                        >
                          <input
                            type="radio"
                            name="productionWing"
                            value={wing}
                            disabled={isLocked}
                            checked={isWingSelected}
                            onChange={() => setSelectedWing(wing)}
                            className="accent-sibs-orange"
                          />
                          <span className="sibs-text-xs">{wing}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Field 2: Workstation Number */}
                <div className="space-y-1.5">
                  <label className="block sibs-text-xs font-bold text-sibs-navy">
                    Field 2 — Specific Seat / Workstation Number <span className="text-red-500">*</span>
                  </label>
                  <p className="sibs-text-micro text-sibs-muted">
                    Accepts standard seat identifiers such as 12, 105, LW-012, or RW-021. Whitespace is automatically trimmed.
                  </p>
                  <input
                    type="text"
                    required
                    disabled={selectedApp.handoffStatus === "Accepted" || selectedApp.outcome === "Completed Handoff"}
                    value={seatNumberInput}
                    onChange={(e) => setSeatNumberInput(e.target.value)}
                    placeholder="e.g. LW-012, RW-021, 105, 12"
                    className="w-full px-3.5 py-2 sibs-text-xs rounded-xl border border-sibs-border font-mono focus:outline-none focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange disabled:bg-sibs-surface disabled:text-sibs-muted"
                  />
                </div>

                {/* Correction Reason or Optional Remarks */}
                <div className="space-y-1.5">
                  <label className="block sibs-text-xs font-bold text-sibs-navy">
                    {selectedApp.wfmStatus === "Assigned" ? (
                      <>
                        Correction Reason / Reassignment Justification <span className="text-red-500">*</span>
                      </>
                    ) : (
                      <>
                        WFM Assignment Remarks <span className="text-sibs-muted font-normal">(Optional)</span>
                      </>
                    )}
                  </label>
                  <textarea
                    rows={2}
                    value={remarksInput}
                    disabled={selectedApp.handoffStatus === "Accepted" || selectedApp.outcome === "Completed Handoff"}
                    onChange={(e) => setRemarksInput(e.target.value)}
                    placeholder={
                      selectedApp.wfmStatus === "Assigned"
                        ? "e.g. Ergonomic accommodation request, team seating reorganization, or equipment upgrade..."
                        : "e.g. Proximity to shift supervisor, dual-monitor pod, specialized headset station..."
                    }
                    className="w-full px-3 py-2 sibs-text-xs rounded-xl border border-sibs-border focus:outline-none focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange disabled:bg-sibs-surface disabled:text-sibs-muted"
                  />
                  {selectedApp.wfmStatus === "Assigned" && (
                    <p className="sibs-text-micro text-amber-700 font-medium">
                      Modifying an already assigned seat requires an audit justification reason before confirmation.
                    </p>
                  )}
                </div>

                {/* Existing Assignment Metadata if already assigned */}
                {selectedApp.wfmStatus === "Assigned" && selectedApp.wfmAssignedAt && (
                  <div className="p-3 bg-green-50/80 border border-green-200 rounded-xl text-green-950 sibs-text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-green-900">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      <span>Currently Assigned Workstation</span>
                    </div>
                    <div><strong>Assigned Wing:</strong> {selectedApp.wfmProductionWing}</div>
                    <div><strong>Workstation:</strong> <span className="font-mono font-bold">{selectedApp.wfmSeatNumber}</span></div>
                    <div><strong>Assigned By:</strong> {selectedApp.wfmAssignedBy}</div>
                    <div><strong>Timestamp:</strong> {selectedApp.wfmAssignedAt}</div>
                    {selectedApp.wfmRemarks && <div><strong>Remarks:</strong> {selectedApp.wfmRemarks}</div>}
                  </div>
                )}

                {/* Locked banner if accepted */}
                {(selectedApp.handoffStatus === "Accepted" || selectedApp.outcome === "Completed Handoff") && (
                  <div className="p-3 bg-green-50/80 border border-green-200 rounded-xl text-green-900 sibs-text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <span>Handoff Formally Accepted by HR Operations — Production Seat is Locked & Immutably Preserved.</span>
                  </div>
                )}
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-sibs-border flex items-center justify-between gap-3">
                <span className="sibs-text-micro text-sibs-muted">
                  {selectedApp.handoffStatus === "Accepted" || selectedApp.outcome === "Completed Handoff"
                    ? "Production workstation assignment is finalized."
                    : "Submitting forwards handoff directly to HR Operations."}
                </span>

                {selectedApp.handoffStatus !== "Accepted" && selectedApp.outcome !== "Completed Handoff" && (
                  <button
                    type="submit"
                    disabled={
                      !selectedApp.officialKronosId ||
                      !seatNumberInput.trim() ||
                      (selectedApp.wfmStatus === "Assigned" && !remarksInput.trim())
                    }
                    className="sibs-btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {selectedApp.wfmStatus === "Assigned"
                        ? "Save Workstation Reassignment"
                        : "Confirm Assignment & Forward to HR"}
                    </span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default NHOWFMDashboard;
