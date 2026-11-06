import { useState } from "react";
import { useNHO } from "../NHOContext";
import {
  CheckCircle,
  AlertTriangle,
  Check,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useJourney } from "../../journey/JourneyContext";
import EmployeeJourneyDrillDown from "../../journey/drilldown/EmployeeJourneyDrillDown";
import TwoWeekTrainingScheduleView from "../TwoWeekTrainingScheduleView";

function NHOHRDashboard({ subTab = "handoffs", onSubTabChange }) {
  const {
    applicants,
    activeApplicant,
    setSelectedApplicantId,
    hrAcceptHandoff,
    hrReturnHandoff,
    verifyDocument,
    qdsAddMaterial,
    qdsConfirmMaterials,
    trainerAcceptTrainee,
    showToast,
  } = useNHO();

  const [activeTab, setActiveTab] = useState(subTab);
  const [selectedHandoffId, setSelectedHandoffId] = useState(activeApplicant?.id || "");
  const [returnRemarks, setReturnRemarks] = useState("");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [ownershipFilter, setOwnershipFilter] = useState("HR-Owned");

  const { journeys, getJourneyByNhoApplicantId, createOrLinkJourneyFromNHO } = useJourney();
  const [drawerJourney, setDrawerJourney] = useState(null);
  const [isJourneyDrawerOpen, setIsJourneyDrawerOpen] = useState(false);

  const handleOpenJourney = (app) => {
    let j = getJourneyByNhoApplicantId(app.id);
    if (!j && app.officialKronosId) {
      j = journeys.find((item) => item.kronosId === app.officialKronosId);
    }
    if (!j) {
      const res = createOrLinkJourneyFromNHO(app, "Dulla, Ralph Vincent (HR Operations Lead)");
      j = res.journey;
    }
    if (j) {
      setDrawerJourney(j);
      setIsJourneyDrawerOpen(true);
    }
  };

  const currentTab = onSubTabChange ? subTab : activeTab;
  const handoffQueue = applicants.filter(
    (a) => a.handoffStatus !== "Not Ready" && a.handoffStatus !== "Pending WFM Assignment"
  );
  const selectedHandoff =
    applicants.find((a) => a.id === selectedHandoffId) || handoffQueue[0] || activeApplicant;

  const allPendingDocs = applicants.flatMap((app) =>
    app.documents
      .filter((d) => !d.isMajor && !d.isEssentialAgreement && d.status !== "Verified")
      .map((doc) => ({
        app,
        doc,
        isHrOwned: app.handoffStatus === "Accepted",
        ownerLabel:
          app.handoffStatus === "Accepted"
            ? "HR Operations"
            : "Talent Acquisition (Pre-Handoff)",
      }))
  );

  const pendingRequirementsList = allPendingDocs.filter((item) => {
    if (ownershipFilter === "HR-Owned") return item.isHrOwned;
    if (ownershipFilter === "TA-Owned") return !item.isHrOwned;
    return true;
  });

  const handleOpenHandoff = (app) => {
    setSelectedHandoffId(app.id);
    setSelectedApplicantId(app.id);
  };

  const handleAccept = (appId) => {
    const target = applicants.find((a) => a.id === appId);
    if (target) {
      if (target.qdsStatus !== "Completed" || (target.qdsMaterials?.length || 0) === 0) {
        qdsAddMaterial(appId, {
          title: "Core Operations Handbook 2026",
          type: "PDF Document",
          fileOrLinkRef: "Core_Ops_2026.pdf",
        });
        qdsConfirmMaterials(appId);
      }
      if (target.trainerStatus !== "Accepted") {
        trainerAcceptTrainee(
          appId,
          target.assignedTrainerId || "TRN-001",
          true,
          "Training responsibility confirmed"
        );
      }
    }
    hrAcceptHandoff(appId);
  };

  const handleReturn = () => {
    if (!returnRemarks.trim()) {
      showToast("Please provide mandatory return remarks.", "error");
      return;
    }
    hrReturnHandoff(selectedHandoff.id, returnRemarks);
    setShowReturnModal(false);
    setReturnRemarks("");
  };

  return (
    <div className="space-y-6 font-jakarta">
      {/* Main Tabs Container */}
      <div
        className="sibs-page-card-in bg-white rounded-2xl border border-sibs-border shadow-xs overflow-hidden"
        style={{ animationDelay: "180ms", animationFillMode: "both" }}
      >
        <div className="flex items-center gap-2 border-b border-sibs-border px-4 overflow-x-auto text-xs bg-sibs-surface/50">
          <button
            type="button"
            onClick={() => {
              if (onSubTabChange) onSubTabChange("handoffs");
              setActiveTab("handoffs");
            }}
            className={`py-3 px-3 font-bold border-b-2 transition-colors cursor-pointer ${
              currentTab === "handoffs" || currentTab === "review"
                ? "border-sibs-orange text-sibs-navy font-extrabold"
                : "border-transparent text-sibs-muted hover:text-sibs-navy"
            }`}
          >
            NHO Handoff Reviews ({handoffQueue.length})
          </button>
          <button
            type="button"
            onClick={() => {
              if (onSubTabChange) onSubTabChange("pending-reqs");
              setActiveTab("pending-reqs");
            }}
            className={`py-3 px-3 font-bold border-b-2 transition-colors cursor-pointer ${
              currentTab === "pending-reqs"
                ? "border-sibs-orange text-sibs-navy font-extrabold"
                : "border-transparent text-sibs-muted hover:text-sibs-navy"
            }`}
          >
            14-Day Pending Requirements ({pendingRequirementsList.length})
          </button>
        </div>

        <div className="p-6">
          {/* Subtab 1: Handoff Reviews */}
          {(currentTab === "handoffs" || currentTab === "review") && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Queue list */}
                <div className="lg:col-span-1 border border-sibs-border rounded-xl overflow-hidden divide-y divide-sibs-border text-xs bg-white shadow-xs">
                  <div className="p-3 bg-sibs-surface font-extrabold text-sibs-navy uppercase tracking-wider sibs-text-micro">
                    Handoff Packages ({handoffQueue.length})
                  </div>
                  {handoffQueue.length === 0 ? (
                    <div className="p-6 text-center text-sibs-muted italic">
                      No handoffs submitted to HR yet.
                    </div>
                  ) : (
                    handoffQueue.map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => handleOpenHandoff(app)}
                        className={`w-full text-left p-4 hover:bg-sibs-surface transition-colors cursor-pointer flex flex-col gap-1 ${
                          app.id === selectedHandoff?.id
                            ? "bg-orange-50/70 border-l-4 border-l-sibs-orange"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sibs-navy">{app.fullName}</span>
                          <span
                            className={
                              app.handoffStatus === "Accepted"
                                ? "sibs-badge-success"
                                : app.handoffStatus === "Returned for Correction"
                                ? "sibs-badge-danger"
                                : "sibs-badge-purple"
                            }
                          >
                            {app.handoffStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between sibs-text-micro text-sibs-muted font-mono mt-0.5">
                          <span>Kronos: {app.officialKronosId || "Pending"}</span>
                          {app.handoffStatus === "Accepted" && (
                            <span className="px-1.5 py-0.2 rounded font-bold bg-orange-100 text-sibs-orange flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> Journey
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Right: Detailed Structured Handoff Summary */}
                <div className="lg:col-span-2 space-y-5 text-xs">
                  <div className="bg-sibs-surface border border-sibs-border rounded-2xl p-6 space-y-5">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-sibs-border">
                      <div>
                        <span className="sibs-text-micro font-extrabold text-sibs-orange uppercase tracking-wider block">
                          Official HR Handoff Summary
                        </span>
                        <h2 className="sibs-text-md font-extrabold text-sibs-navy mt-0.5">
                          {selectedHandoff.fullName} ({selectedHandoff.applicantNumber})
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedHandoff.handoffStatus === "Accepted" && (
                          <button
                            type="button"
                            onClick={() => handleOpenJourney(selectedHandoff)}
                            className="sibs-btn-primary flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Open Employee Journey</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        <span
                          className={
                            selectedHandoff.handoffStatus === "Accepted"
                              ? "sibs-badge-success"
                              : selectedHandoff.handoffStatus === "Returned for Correction"
                              ? "sibs-badge-danger"
                              : "sibs-badge-purple"
                          }
                        >
                          {selectedHandoff.handoffStatus}
                        </span>
                      </div>
                    </div>

                    {/* 30/60/90 Journey Banner Card if Accepted */}
                    {selectedHandoff.handoffStatus === "Accepted" && (
                      <div className="p-3.5 bg-gradient-to-r from-orange-50/80 via-amber-50/40 to-emerald-50/50 border border-sibs-orange/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-100 border border-sibs-orange/30 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-sibs-orange" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sibs-navy sibs-text-xs">
                                30 / 60 / 90 Employee Journey Active
                              </span>
                              <span className="px-2 py-0.5 rounded-full sibs-text-micro font-extrabold bg-sibs-navy text-white font-mono">
                                {selectedHandoff.linkedEmployeeJourneyId || "JRN-2026-ACTIVE"}
                              </span>
                            </div>
                            <p className="sibs-text-micro text-sibs-muted mt-0.5">
                              Enrolled in nesting and 90-day regularization roadmap. Assigned Trainer:{" "}
                              {selectedHandoff.assignedTrainerName || "Assigned"} | Seat:{" "}
                              {selectedHandoff.wfmSeatNumber || "Pending"}.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenJourney(selectedHandoff)}
                          className="px-3.5 py-2 rounded-xl bg-sibs-navy hover:bg-sibs-tertiary-2 text-white font-bold sibs-text-xs shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-sibs-orange" />
                          <span>View Journey</span>
                        </button>
                      </div>
                    )}

                    {/* Summary Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-sibs-border">
                        <span className="sibs-text-micro text-sibs-muted block font-extrabold uppercase tracking-wider">
                          Official Kronos ID
                        </span>
                        <span className="font-mono font-bold text-purple-900 sibs-text-xs block mt-1">
                          {selectedHandoff.officialKronosId || "Not assigned"}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-sibs-border">
                        <span className="sibs-text-micro text-sibs-muted block font-extrabold uppercase tracking-wider">
                          Training Schedule Date
                        </span>
                        <span className="font-bold text-sibs-orange sibs-text-xs block mt-1">
                          {selectedHandoff.qdsAssignedScheduleDate ||
                            selectedHandoff.scheduledNhoDate ||
                            "Unassigned"}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-sibs-border">
                        <span className="sibs-text-micro text-sibs-muted block font-extrabold uppercase tracking-wider">
                          Physical NHO Date
                        </span>
                        <span className="font-bold text-sibs-navy sibs-text-xs block mt-1">
                          {selectedHandoff.clearedDate || selectedHandoff.scheduledNhoDate}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-sibs-border">
                        <span className="sibs-text-micro text-sibs-muted block font-extrabold uppercase tracking-wider">
                          14-Day Non-Major Deadline
                        </span>
                        <span className="font-bold text-sibs-navy sibs-text-xs block mt-1">
                          {selectedHandoff.nonMajorDeadlineDate}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-sibs-border">
                        <span className="sibs-text-micro text-sibs-muted block font-extrabold uppercase tracking-wider">
                          4 Major Requirements
                        </span>
                        <span className="font-bold text-green-700 sibs-text-xs block mt-1">
                          4/4 Uploaded & Verified
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-sibs-border">
                        <span className="sibs-text-micro text-sibs-muted block font-extrabold uppercase tracking-wider">
                          Orientation Acknowledgment
                        </span>
                        <span className="font-bold text-green-700 sibs-text-xs block mt-1">
                          Completed & Signed
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-sibs-border">
                        <span className="sibs-text-micro text-sibs-muted block font-extrabold uppercase tracking-wider">
                          3 Essential Agreements
                        </span>
                        <span className="font-bold text-green-700 sibs-text-xs block mt-1">
                          3/3 Verified by TA
                        </span>
                      </div>
                    </div>

                    {/* Pending Non-Majors Breakdown */}
                    <div className="p-4 bg-white rounded-xl border border-sibs-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sibs-navy sibs-text-xs">
                          Pending Non-Major Requirements Transferring to HR Ownership:
                        </span>
                        <span className="sibs-text-micro text-sibs-muted">
                          Due: {selectedHandoff.nonMajorDeadlineDate}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {selectedHandoff.documents
                          .filter((d) => !d.isMajor && !d.isEssentialAgreement)
                          .map((d) => (
                            <div
                              key={d.id}
                              className="flex items-center justify-between sibs-text-xs p-2.5 bg-sibs-surface rounded-lg border border-sibs-border/60"
                            >
                              <span className="text-sibs-navy font-semibold">{d.name}</span>
                              <span
                                className={
                                  d.status === "Verified" ? "sibs-badge-success" : "sibs-badge-amber"
                                }
                              >
                                {d.status}
                              </span>
                            </div>
                          ))}
                      </div>

                      <p className="sibs-text-micro text-sibs-muted pt-1">
                        * Note: Pending non-major documents do not block HR acceptance. Upon acceptance, HR takes primary ownership of follow-ups.
                      </p>
                    </div>

                    {/* Post-IT Workstation & Training Schedule Alignment */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between pb-1">
                        <h3 className="font-extrabold text-sibs-navy sibs-text-xs uppercase tracking-wider">
                          Post-IT Workstation & Training Schedule Alignment
                        </h3>
                        <span className="sibs-text-micro text-sibs-muted">Required for HR handoff acceptance</span>
                      </div>

                      {/* 1. WFM Production Assignment Section */}
                      <div className="p-4 bg-white rounded-xl border border-sibs-border space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-sibs-orange" />
                            <span className="font-extrabold text-sibs-navy sibs-text-xs uppercase tracking-wider">
                              1. WFM Production Seat Assignment
                            </span>
                          </div>
                          <span
                            className={
                              selectedHandoff.wfmStatus === "Assigned"
                                ? "sibs-badge-success"
                                : "sibs-badge-amber"
                            }
                          >
                            {selectedHandoff.wfmStatus || "Not Ready"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sibs-text-xs pt-1">
                          <div className="p-2.5 bg-sibs-surface rounded-lg border border-sibs-border/60">
                            <span className="sibs-text-micro text-sibs-muted block font-extrabold uppercase">
                              Assigned Wing
                            </span>
                            <span className="font-extrabold text-sibs-navy block mt-0.5">
                              {selectedHandoff.wfmProductionWing || "Pending WFM"}
                            </span>
                          </div>
                          <div className="p-2.5 bg-sibs-surface rounded-lg border border-sibs-border/60">
                            <span className="sibs-text-micro text-sibs-muted block font-extrabold uppercase">
                              Seat / Workstation #
                            </span>
                            <span className="font-mono font-bold text-purple-900 block mt-0.5">
                              {selectedHandoff.wfmSeatNumber || "Pending WFM"}
                            </span>
                          </div>
                          <div className="p-2.5 bg-sibs-surface rounded-lg border border-sibs-border/60">
                            <span className="sibs-text-micro text-sibs-muted block font-extrabold uppercase">
                              Assigned By
                            </span>
                            <span
                              className="text-sibs-navy font-semibold block mt-0.5 truncate"
                              title={selectedHandoff.wfmAssignedBy || "—"}
                            >
                              {selectedHandoff.wfmAssignedBy || "—"}
                            </span>
                          </div>
                          <div className="p-2.5 bg-sibs-surface rounded-lg border border-sibs-border/60">
                            <span className="sibs-text-micro text-sibs-muted block font-extrabold uppercase">
                              Assigned Date
                            </span>
                            <span className="text-sibs-navy font-semibold block mt-0.5">
                              {selectedHandoff.wfmAssignedAt || "—"}
                            </span>
                          </div>
                        </div>

                        {selectedHandoff.wfmRemarks && (
                          <div className="p-2.5 bg-sibs-surface border border-sibs-border rounded-lg sibs-text-xs text-sibs-navy">
                            <strong>WFM Remarks:</strong> {selectedHandoff.wfmRemarks}
                          </div>
                        )}
                      </div>

                      {/* 2. Training Attendance Schedule (2-Week PST & FST Matrix) */}
                      <div className="p-4 bg-white rounded-xl border border-sibs-border space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-sibs-orange" />
                            <span className="font-extrabold text-sibs-navy sibs-text-xs uppercase tracking-wider">
                              2. Training Attendance Schedule (2-Week PST & FST Matrix)
                            </span>
                          </div>
                          <span className="sibs-badge-success inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span>Schedule Confirmed</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sibs-text-xs pt-0.5">
                          <div className="p-2.5 bg-sibs-surface rounded-lg border border-sibs-border">
                            <span className="sibs-text-micro text-sibs-muted block font-extrabold uppercase">
                              Schedule Start Date
                            </span>
                            <span className="font-extrabold text-sibs-navy block mt-0.5">
                              {selectedHandoff.qdsAssignedScheduleDate ||
                                selectedHandoff.scheduledNhoDate ||
                                "2026-10-12"}
                            </span>
                          </div>
                          <div className="p-2.5 bg-sibs-surface rounded-lg border border-sibs-border">
                            <span className="sibs-text-micro text-sibs-muted block font-extrabold uppercase">
                              Shift Hours
                            </span>
                            <span className="font-bold text-sibs-navy block mt-0.5">
                              {selectedHandoff.qdsShiftHours || "08:00 AM – 05:00 PM (Default)"}
                            </span>
                          </div>
                          <div className="p-2.5 bg-sibs-surface rounded-lg border border-sibs-border">
                            <span className="sibs-text-micro text-sibs-muted block font-extrabold uppercase">
                              Training Facility / Room
                            </span>
                            <span className="font-bold text-sibs-navy block mt-0.5">
                              {selectedHandoff.qdsTrainingLocation || "Fintech Training Room 4A"}
                            </span>
                          </div>
                        </div>

                        {/* 2-Week Based PST & FST Clickable Schedule View */}
                        <div className="pt-2 border-t border-sibs-border">
                          <TwoWeekTrainingScheduleView
                            startDate={
                              selectedHandoff.qdsAssignedScheduleDate ||
                              selectedHandoff.scheduledNhoDate ||
                              "2026-10-12"
                            }
                            assignedTrainerId={selectedHandoff.assignedTrainerId}
                            assignedTrainerName={selectedHandoff.assignedTrainerName}
                            existingMaterials={selectedHandoff.qdsMaterials || []}
                            shiftHours={
                              selectedHandoff.qdsShiftHours || "08:00 AM – 05:00 PM (Default)"
                            }
                            trainingLocation={
                              selectedHandoff.qdsTrainingLocation || "Fintech Training Room 4A"
                            }
                            traineeName={selectedHandoff.fullName}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Return notes if any */}
                    {selectedHandoff.handoffStatus === "Returned for Correction" &&
                      selectedHandoff.handoffCorrectionRemarks && (
                        <div className="p-3.5 bg-red-50/80 border border-red-200 rounded-xl text-red-950 sibs-text-xs">
                          <strong>Correction Note Dispatched to TA:</strong>{" "}
                          {selectedHandoff.handoffCorrectionRemarks}
                        </div>
                      )}

                    {/* Pre-acceptance Status Verification Alert */}
                    {selectedHandoff.handoffStatus !== "Accepted" &&
                      (!selectedHandoff.officialKronosId ||
                        selectedHandoff.itRequestStatus !== "Completed" ||
                        selectedHandoff.wfmStatus !== "Assigned") && (
                        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-950 sibs-text-xs flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong>Pending Department Prerequisites:</strong> Mandatory assignments required before accepting this handoff:
                            <ul className="list-disc list-inside mt-1 space-y-0.5 sibs-text-micro">
                              <li
                                className={
                                  selectedHandoff.itRequestStatus === "Completed" &&
                                  !!selectedHandoff.officialKronosId
                                    ? "text-green-800 font-bold"
                                    : "text-amber-900"
                                }
                              >
                                IT Provisioning:{" "}
                                {selectedHandoff.itRequestStatus === "Completed" &&
                                selectedHandoff.officialKronosId
                                  ? `Completed (${selectedHandoff.officialKronosId})`
                                  : "Pending completion"}
                              </li>
                              <li className="text-green-800 font-bold">
                                Training Attendance Schedule: 2-Week PST & FST Matrix Synchronized
                              </li>
                              <li
                                className={
                                  selectedHandoff.wfmStatus === "Assigned"
                                    ? "text-green-800 font-bold"
                                    : "text-amber-900"
                                }
                              >
                                WFM Seat Assignment:{" "}
                                {selectedHandoff.wfmStatus === "Assigned"
                                  ? `Assigned (${selectedHandoff.wfmProductionWing} - ${selectedHandoff.wfmSeatNumber})`
                                  : "Pending WFM workstation"}
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}

                    {/* Action buttons */}
                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-sibs-border">
                      {selectedHandoff.handoffStatus !== "Accepted" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowReturnModal(true)}
                            className="sibs-btn-danger"
                          >
                            Return for Correction
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAccept(selectedHandoff.id)}
                            disabled={
                              !selectedHandoff.officialKronosId ||
                              selectedHandoff.itRequestStatus !== "Completed" ||
                              selectedHandoff.wfmStatus !== "Assigned" ||
                              !selectedHandoff.wfmProductionWing ||
                              !selectedHandoff.wfmSeatNumber
                            }
                            className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold sibs-text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            <span>Accept Handoff & Transfer Ownership</span>
                          </button>
                        </>
                      )}

                      {selectedHandoff.handoffStatus === "Accepted" && (
                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="flex items-center gap-2 text-green-800 bg-green-50 px-4 py-2 rounded-xl border border-green-200 font-bold sibs-text-xs">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>
                              Accepted by {selectedHandoff.hrAcceptedBy} on {selectedHandoff.hrAcceptedAt}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenJourney(selectedHandoff)}
                            className="sibs-btn-primary flex items-center gap-1.5"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Open Employee Journey</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 2: 14-Day Pending Requirements Monitor */}
          {currentTab === "pending-reqs" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-950 sibs-text-xs">
                <strong>HR Ownership of Non-Major Requirements (Phase 7 & Phase 10):</strong> Before handoff acceptance, TA owns pending non-major requirements. Upon formal HR handoff acceptance, HR assumes primary operational ownership of tracking outstanding documents. The standard deadline of 14 calendar days from physical NHO clearance is preserved.
              </div>

              {/* Ownership Filter Tabs */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-sibs-surface p-1 rounded-xl border border-sibs-border">
                  <button
                    type="button"
                    onClick={() => setOwnershipFilter("HR-Owned")}
                    className={`px-3 py-1.5 rounded-lg font-bold sibs-text-xs transition-colors cursor-pointer ${
                      ownershipFilter === "HR-Owned"
                        ? "bg-sibs-navy text-white shadow-xs"
                        : "text-sibs-muted hover:text-sibs-navy"
                    }`}
                  >
                    HR-Owned (Handoff Accepted) ({allPendingDocs.filter((d) => d.isHrOwned).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOwnershipFilter("TA-Owned")}
                    className={`px-3 py-1.5 rounded-lg font-bold sibs-text-xs transition-colors cursor-pointer ${
                      ownershipFilter === "TA-Owned"
                        ? "bg-sibs-navy text-white shadow-xs"
                        : "text-sibs-muted hover:text-sibs-navy"
                    }`}
                  >
                    TA-Owned (Pre-Handoff) ({allPendingDocs.filter((d) => !d.isHrOwned).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOwnershipFilter("All")}
                    className={`px-3 py-1.5 rounded-lg font-bold sibs-text-xs transition-colors cursor-pointer ${
                      ownershipFilter === "All"
                        ? "bg-sibs-navy text-white shadow-xs"
                        : "text-sibs-muted hover:text-sibs-navy"
                    }`}
                  >
                    All Pending ({allPendingDocs.length})
                  </button>
                </div>
                <span className="sibs-text-micro text-sibs-muted font-medium">
                  Showing: <strong className="text-sibs-navy">{ownershipFilter}</strong> requirements
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-sibs-border shadow-xs overflow-hidden divide-y divide-sibs-border">
                {pendingRequirementsList.length === 0 ? (
                  <div className="p-8 text-center text-sibs-muted italic">
                    No pending requirements found matching filter: {ownershipFilter}.
                  </div>
                ) : (
                  pendingRequirementsList.map(({ app, doc, isHrOwned, ownerLabel }) => (
                    <div
                      key={`${app.id}-${doc.id}`}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-sibs-surface/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sibs-navy">{app.fullName}</span>
                          <span className="font-mono text-sibs-muted sibs-text-micro">({app.applicantNumber})</span>
                          <span
                            className={isHrOwned ? "sibs-badge-purple" : "sibs-badge-secondary"}
                          >
                            Owner: {ownerLabel}
                          </span>
                          <span
                            className={
                              doc.deadlineStatus === "Overdue"
                                ? "sibs-badge-danger"
                                : doc.deadlineStatus === "Submitted Late"
                                ? "sibs-badge-amber"
                                : "sibs-badge-info"
                            }
                          >
                            {doc.deadlineStatus}
                          </span>
                        </div>

                        <div className="text-sibs-navy font-semibold sibs-text-xs">
                          {doc.name} • Status: <span className="text-sibs-muted font-normal">{doc.status}</span>
                        </div>

                        <div className="sibs-text-micro text-sibs-muted flex items-center gap-3">
                          <span>Physical NHO Cleared: {app.clearedDate || "—"}</span>
                          <span>•</span>
                          <span>
                            Original 14-Day Deadline:{" "}
                            <strong className="text-sibs-navy">{doc.dueDate}</strong>
                          </span>
                          {doc.fileName && (
                            <>
                              <span>•</span>
                              <span>File: {doc.fileName}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {doc.status === "For Verification" && (
                          <button
                            type="button"
                            onClick={() => verifyDocument(app.id, doc.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold sibs-text-xs shadow-xs cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Verify Document</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHandoffId(app.id);
                            setSelectedApplicantId(app.id);
                            setActiveTab("handoffs");
                          }}
                          className="sibs-btn-secondary !py-1.5 !px-3.5"
                        >
                          View Handoff
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-sibs-border sibs-text-xs space-y-4">
            <h3 className="sibs-text-sm font-extrabold text-red-600">
              Return Handoff to Talent Acquisition
            </h3>
            <p className="text-sibs-muted leading-relaxed">
              Please state the exact discrepancy or missing verification reason. The handoff record will be returned to TA for rectification without deleting the existing Kronos account.
            </p>
            <textarea
              rows={3}
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
              placeholder="e.g. Discrepancy in middle name spelling on Government ID vs Kronos profile; please reconcile with TA records..."
              className="w-full p-2.5 border border-sibs-border rounded-xl focus:outline-none focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="sibs-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReturn}
                className="sibs-btn-danger"
              >
                Confirm Return to TA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Journey 7-Tab Drill-Down */}
      {drawerJourney && (
        <EmployeeJourneyDrillDown
          journey={drawerJourney}
          isOpen={isJourneyDrawerOpen}
          onClose={() => setIsJourneyDrawerOpen(false)}
        />
      )}
    </div>
  );
}

export default NHOHRDashboard;
