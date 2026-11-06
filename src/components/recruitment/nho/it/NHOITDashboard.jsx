import { useState } from "react";
import { useNHO } from "../NHOContext";
import {
  CheckCircle,
  AlertTriangle,
  Edit3,
  Check,
  Lock,
  Server,
} from "lucide-react";

function NHOITDashboard({ subTab = "queue", onSubTabChange }) {
  const {
    applicants,
    activeApplicant,
    setSelectedApplicantId,
    itStartProcessing,
    itUpdatePermittedFields,
    itCompleteProvisioning,
    showToast,
  } = useNHO();

  const [selectedAppId, setSelectedAppId] = useState(activeApplicant.id);
  const [kronosInput, setKronosInput] = useState("");
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [editedFields, setEditedFields] = useState({
    proposedUsername: "",
    displayName: "",
    dept: "",
    remarks: "",
  });
  const [fieldEditReason, setFieldEditReason] = useState("");

  const itQueue = applicants.filter((a) => a.itEndorsed);
  const selectedApp =
    applicants.find((a) => a.id === selectedAppId) || itQueue[0] || activeApplicant;

  const handleSelectApp = (app) => {
    setSelectedAppId(app.id);
    setSelectedApplicantId(app.id);
    setKronosInput(app.officialKronosId || `KRN-9${app.applicantNumber.slice(-4)}`);
    setEditedFields({
      proposedUsername: app.proposedKronosUsername,
      displayName: app.kronosDisplayName,
      dept: app.assignedDepartment,
      remarks: app.itProvisioningRemarks || "",
    });
    setIsEditingFields(false);
  };

  const handleStartProcessing = () => {
    itStartProcessing(selectedApp.id);
  };

  const handleSavePermittedUpdates = () => {
    if (!fieldEditReason.trim()) {
      showToast("Please provide a reason for editing account provisioning fields.", "error");
      return;
    }
    itUpdatePermittedFields(selectedApp.id, editedFields, fieldEditReason);
    setIsEditingFields(false);
    setFieldEditReason("");
  };

  const handleComplete = () => {
    const res = itCompleteProvisioning(selectedApp.id, kronosInput);
    if (res.success) {
      setIsEditingFields(false);
    }
  };

  return (
    <div className="space-y-6 font-jakarta">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Requests Queue List */}
        <div
          className="sibs-page-card-in lg:col-span-1 bg-white rounded-2xl border border-sibs-border shadow-xs overflow-hidden flex flex-col"
          style={{ animationDelay: "180ms", animationFillMode: "both" }}
        >
          <div className="p-4 border-b border-sibs-border flex items-center justify-between bg-sibs-surface">
            <span className="sibs-text-xs font-extrabold text-sibs-navy uppercase tracking-wider flex items-center gap-1.5">
              <Server className="h-4 w-4 text-sibs-orange" />
              <span>Endorsed Requests ({itQueue.length})</span>
            </span>
            <span className="sibs-text-micro text-sibs-muted font-semibold">Queue from TA</span>
          </div>

          <div className="divide-y divide-sibs-border overflow-y-auto max-h-[600px] text-xs sibs-scrollbar">
            {itQueue.length === 0 ? (
              <div className="p-8 text-center text-sibs-muted italic">
                No active ID Creation Requests in the IT Queue. Endorse candidates from TA first.
              </div>
            ) : (
              itQueue.map((app) => {
                const isSelected = app.id === selectedApp.id;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleSelectApp(app)}
                    className={`w-full text-left p-4 hover:bg-sibs-surface transition-colors cursor-pointer flex flex-col gap-1.5 ${
                      isSelected ? "bg-orange-50/70 border-l-4 border-l-sibs-orange" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sibs-navy text-xs">{app.fullName}</span>
                      <span
                        className={
                          app.itRequestStatus === "Completed"
                            ? "sibs-badge-success"
                            : app.itRequestStatus === "In Progress"
                            ? "sibs-badge-info"
                            : "sibs-badge-warning"
                        }
                      >
                        {app.itRequestStatus}
                      </span>
                    </div>

                    <div className="text-[11px] text-sibs-muted font-medium">
                      {app.position} • {app.department}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-sibs-muted pt-1">
                      <span>Endorsed: {app.itEndorsedAt?.split(" ")[0]}</span>
                      {app.officialKronosId && (
                        <span className="font-mono font-bold text-sibs-navy">
                          ID: {app.officialKronosId}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: ID Creation Request Details & Provisioning Form */}
        <div
          className="sibs-page-card-in lg:col-span-2 space-y-6"
          style={{ animationDelay: "240ms", animationFillMode: "both" }}
        >
          <div className="bg-white rounded-2xl border border-sibs-border shadow-xs p-5 sm:p-6 space-y-6 text-xs">
            {/* Header Info */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-sibs-border">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-lg font-bold text-sibs-navy">
                    {selectedApp.fullName}
                  </h2>
                  <span className="text-xs font-mono text-sibs-muted bg-sibs-surface border border-sibs-border px-2 py-0.5 rounded font-medium">
                    {selectedApp.applicantNumber}
                  </span>
                  <span
                    className={
                      selectedApp.itRequestStatus === "Completed"
                        ? "sibs-badge-success"
                        : selectedApp.itRequestStatus === "In Progress"
                        ? "sibs-badge-info"
                        : "sibs-badge-warning"
                    }
                  >
                    {selectedApp.itRequestStatus}
                  </span>
                </div>
                <p className="text-xs text-sibs-muted mt-0.5">
                  {selectedApp.position} • {selectedApp.department} ({selectedApp.account})
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedApp.itRequestStatus === "Pending" && (
                  <button
                    type="button"
                    onClick={handleStartProcessing}
                    className="sibs-btn-primary h-8.5 px-3.5 text-xs font-bold cursor-pointer shadow-xs"
                  >
                    Start Processing
                  </button>
                )}
              </div>
            </div>

            {/* Read-Only HRIS Identity Banner */}
            <div className="p-3.5 bg-sibs-surface border border-sibs-border rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-sibs-navy font-bold text-[11px]">
                <Lock className="w-3.5 h-3.5 text-sibs-orange" />
                <span>Authoritative HRIS Identity Records (Read-Only for IT):</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-sibs-navy pt-1">
                <div>Legal Name: <strong>{selectedApp.fullName}</strong></div>
                <div>Account: <strong>{selectedApp.account}</strong></div>
                <div>Venue: <strong>{selectedApp.reportingLocation.split(",")[0]}</strong></div>
              </div>
            </div>

            {/* Permitted Editable Provisioning Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="sibs-text-micro font-extrabold text-sibs-navy uppercase tracking-wider">
                  Permitted Account Provisioning Fields:
                </span>
                {!isEditingFields && selectedApp.itRequestStatus !== "Completed" && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditedFields({
                        proposedUsername: selectedApp.proposedKronosUsername,
                        displayName: selectedApp.kronosDisplayName,
                        dept: selectedApp.assignedDepartment,
                        remarks: selectedApp.itProvisioningRemarks || "",
                      });
                      setIsEditingFields(true);
                    }}
                    className="sibs-text-xs font-bold text-sibs-orange hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Permitted Fields</span>
                  </button>
                )}
              </div>

              {isEditingFields ? (
                <div className="p-4 bg-sibs-surface border border-sibs-border rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="sibs-text-micro font-extrabold uppercase text-sibs-navy block mb-1">
                        Proposed Kronos Username
                      </label>
                      <input
                        type="text"
                        value={editedFields.proposedUsername}
                        onChange={(e) =>
                          setEditedFields((prev) => ({ ...prev, proposedUsername: e.target.value }))
                        }
                        className="sibs-dashboard-input h-8.5 w-full rounded-lg px-3 text-xs"
                      />
                    </div>
                    <div>
                      <label className="sibs-text-micro font-extrabold uppercase text-sibs-navy block mb-1">
                        Kronos Display Name
                      </label>
                      <input
                        type="text"
                        value={editedFields.displayName}
                        onChange={(e) =>
                          setEditedFields((prev) => ({ ...prev, displayName: e.target.value }))
                        }
                        className="sibs-dashboard-input h-8.5 w-full rounded-lg px-3 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="sibs-text-micro font-extrabold uppercase text-sibs-navy block mb-1">
                      Provisioning Remarks
                    </label>
                    <input
                      type="text"
                      value={editedFields.remarks}
                      onChange={(e) =>
                        setEditedFields((prev) => ({ ...prev, remarks: e.target.value }))
                      }
                      className="sibs-dashboard-input h-8.5 w-full rounded-lg px-3 text-xs"
                    />
                  </div>

                  <div>
                    <label className="sibs-text-micro font-extrabold uppercase text-sibs-navy block mb-1">
                      Mandatory Reason for Editing
                    </label>
                    <input
                      type="text"
                      value={fieldEditReason}
                      onChange={(e) => setFieldEditReason(e.target.value)}
                      placeholder="e.g. Standard username collision resolution, standardized display convention..."
                      className="sibs-dashboard-input h-8.5 w-full rounded-lg px-3 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingFields(false)}
                      className="sibs-btn-secondary h-8 px-3 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePermittedUpdates}
                      className="sibs-btn-primary h-8 px-3.5 text-xs font-bold cursor-pointer"
                    >
                      Save Provisioning Updates
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-sibs-surface rounded-xl border border-sibs-border">
                    <span className="sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted block">
                      Proposed Username
                    </span>
                    <span className="font-mono font-bold text-sibs-navy text-xs block mt-1">
                      {selectedApp.proposedKronosUsername}
                    </span>
                  </div>
                  <div className="p-3 bg-sibs-surface rounded-xl border border-sibs-border">
                    <span className="sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted block">
                      Kronos Display Name
                    </span>
                    <span className="font-bold text-sibs-navy text-xs block mt-1">
                      {selectedApp.kronosDisplayName}
                    </span>
                  </div>
                  <div className="p-3 bg-sibs-surface rounded-xl border border-sibs-border">
                    <span className="sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted block">
                      Assigned Department
                    </span>
                    <span className="font-bold text-sibs-navy text-xs block mt-1">
                      {selectedApp.assignedDepartment}
                    </span>
                  </div>
                  <div className="p-3 bg-sibs-surface rounded-xl border border-sibs-border">
                    <span className="sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted block">
                      Provisioning Remarks
                    </span>
                    <span className="text-sibs-muted text-xs block mt-1">
                      {selectedApp.itProvisioningRemarks || "Standard profile"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Kronos Account Creation Recording Form */}
            <div className="p-5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3">
              <div>
                <span className="sibs-text-xs font-extrabold text-sibs-navy uppercase tracking-wider block">
                  Manual Kronos ID Recording (Phase 9)
                </span>
                <p className="text-[11px] text-sky-900 mt-0.5 leading-relaxed">
                  The Kronos account is manually generated by IT in the external Kronos console. Record the official unique Kronos ID here. The system validates uniqueness against all existing employees.
                </p>
              </div>

              {/* Terminal status warning */}
              {(selectedApp.outcome === "Withdrawn" || selectedApp.outcome === "Drop-Off") && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Case Closed / {selectedApp.outcome}:</strong> Candidate has been withdrawn or dropped off. Outstanding IT provisioning is flagged for cancellation and cannot be marked completed.
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                <div className="flex-1">
                  <label className="sibs-text-micro font-extrabold text-sibs-navy block mb-1">
                    Official Kronos ID:
                  </label>
                  <input
                    type="text"
                    value={kronosInput}
                    onChange={(e) => setKronosInput(e.target.value)}
                    placeholder="e.g. KRN-90841..."
                    disabled={
                      selectedApp.itRequestStatus === "Completed" ||
                      selectedApp.outcome === "Withdrawn" ||
                      selectedApp.outcome === "Drop-Off"
                    }
                    className="w-full h-9 rounded-xl border border-sky-300 bg-white px-3 text-xs font-mono font-bold text-sibs-navy focus:outline-none focus:border-sibs-orange disabled:opacity-50"
                  />
                </div>

                {selectedApp.itRequestStatus !== "Completed" ? (
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={selectedApp.outcome === "Withdrawn" || selectedApp.outcome === "Drop-Off"}
                    className="sibs-btn-primary h-9 px-4 text-xs font-bold cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 self-end sm:self-auto mt-2 sm:mt-5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Complete &amp; Submit Handoff</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl mt-5">
                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                    <span>Provisioning Complete ({selectedApp.officialKronosId})</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NHOITDashboard;
