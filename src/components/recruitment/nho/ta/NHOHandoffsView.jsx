import React, { useState } from "react";
import { useNHO } from "../NHOContext";
import { MetricCard, MetricGrid } from "@/components/ui";
import {
  ShieldCheck,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
} from "lucide-react";

function NHOHandoffsView({ onOpenApplicantDetails }) {
  const { applicants, setSelectedApplicantId, taResubmitHandoff } = useNHO();
  const [resubmittingId, setResubmittingId] = useState(null);
  const [resolutionRemarks, setResolutionRemarks] = useState("");

  const handoffApplicants = applicants.filter(
    (a) => a.itRequestStatus === "Completed" || a.handoffStatus !== "Not Ready"
  );
  const pendingCount = handoffApplicants.filter(
    (a) => a.handoffStatus === "Pending HR Acceptance" || a.handoffStatus === "Resubmitted"
  ).length;
  const acceptedCount = handoffApplicants.filter((a) => a.handoffStatus === "Accepted").length;
  const correctionCount = handoffApplicants.filter(
    (a) => a.handoffStatus === "Returned for Correction"
  ).length;

  const handleConfirmResubmit = (appId) => {
    if (!resolutionRemarks.trim()) {
      return;
    }
    taResubmitHandoff(appId, resolutionRemarks.trim());
    setResubmittingId(null);
    setResolutionRemarks("");
  };

  return (
    <div className="min-w-0 space-y-3.5 sm:space-y-4 2xl:space-y-5 font-jakarta">
      {/* 4 Responsive KPI Cards */}
      <MetricGrid columns={4}>
        <MetricCard
          label="In Pipeline"
          value={handoffApplicants.length}
          description="IT-completed or handed off"
          icon={FileText}
          tone="navy"
          delay={0}
        />
        <MetricCard
          label="Awaiting HR"
          value={pendingCount}
          description="Pending review / resubmitted"
          icon={Clock}
          tone="amber"
          delay={50}
        />
        <MetricCard
          label="Accepted"
          value={acceptedCount}
          description="HR handoff completed"
          icon={CheckCircle}
          tone="green"
          delay={100}
        />
        <MetricCard
          label="Needs Correction"
          value={correctionCount}
          description="Returned for follow-up"
          icon={AlertTriangle}
          tone="red"
          delay={150}
        />
      </MetricGrid>

      {/* Main Handoff Section */}
      <section
        className="sibs-page-card-in min-w-0 rounded-2xl border border-sibs-border bg-white p-4 sm:p-5 shadow-xs"
        style={{ animationDelay: "220ms", animationFillMode: "both" }}
      >
        <div className="mb-4">
          <h2 className="sibs-section-title font-extrabold text-sibs-navy">Handoff Records</h2>
          <p className="sibs-section-subtitle text-sibs-muted mt-0.5">
            Track prepared HR handoffs, Trainer and QDS confirmation, WFM seating, and outstanding corrections.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-sibs-border bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-sibs-border px-4 py-2.5 bg-sibs-surface">
            <div className="flex items-center gap-2 text-xs font-extrabold text-sibs-navy">
              <ShieldCheck className="h-4 w-4 text-sibs-orange" />
              <span>Handoff Pipeline</span>
              <span className="rounded-full bg-sibs-navy px-2 py-0.5 text-[10px] font-black text-white">
                {handoffApplicants.length}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-sibs-muted">
              {handoffApplicants.length} records
            </span>
          </div>

          <div className="divide-y divide-sibs-border text-xs">
            {handoffApplicants.length === 0 ? (
              <div className="p-8 text-center text-sibs-muted italic">
                No applicants currently in the HR Handoff stage. Once IT provisions Kronos IDs, handoffs appear here.
              </div>
            ) : (
              handoffApplicants.map((app) => (
                <div
                  key={app.id}
                  className="p-4 hover:bg-sibs-surface/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sibs-navy text-sm">{app.fullName}</span>
                      <span className="font-mono text-[10px] text-sibs-muted bg-sibs-surface px-2 py-0.5 rounded border border-sibs-border font-medium">
                        {app.applicantNumber}
                      </span>
                      <span
                        className={
                          app.handoffStatus === "Accepted"
                            ? "sibs-badge-success"
                            : app.handoffStatus === "Returned for Correction"
                            ? "sibs-badge-danger"
                            : "sibs-badge-info"
                        }
                      >
                        {app.handoffStatus}
                      </span>
                    </div>

                    <div className="text-[11px] text-sibs-muted flex flex-wrap items-center gap-2 pt-0.5">
                      <span>
                        Kronos: <strong className="text-sibs-navy font-mono">{app.officialKronosId || "—"}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Trainer:{" "}
                        <strong className={app.trainerStatus === "Accepted" ? "text-emerald-700 font-bold" : "text-sibs-navy font-medium"}>
                          {app.trainerStatus || "Pending"}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        QDS:{" "}
                        <strong className={app.qdsStatus === "Completed" ? "text-emerald-700 font-bold" : "text-sibs-navy font-medium"}>
                          {app.qdsStatus || "Pending"}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        WFM:{" "}
                        <strong className={app.wfmStatus === "Assigned" ? "text-emerald-700 font-bold" : "text-sibs-navy font-medium"}>
                          {app.wfmSeatNumber ? `${app.wfmProductionWing || ""} (${app.wfmSeatNumber})` : app.wfmStatus || "Pending"}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>Deadline: {app.nonMajorDeadlineDate}</span>
                    </div>

                    {/* HR Return Remarks */}
                    {app.handoffStatus === "Returned for Correction" && app.handoffCorrectionRemarks && (
                      <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 text-xs">
                        <strong className="block font-bold text-rose-800 mb-0.5">HR Return Note:</strong>
                        <span>{app.handoffCorrectionRemarks}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    {app.handoffStatus === "Returned for Correction" &&
                      (resubmittingId === app.id ? (
                        <div className="flex flex-col gap-1.5 p-2 bg-sibs-surface border border-sibs-border rounded-xl">
                          <input
                            type="text"
                            value={resolutionRemarks}
                            onChange={(e) => setResolutionRemarks(e.target.value)}
                            placeholder="Documented resolution note for HR..."
                            className="px-2.5 py-1 text-xs border border-sibs-border rounded-lg focus:outline-none focus:border-sibs-orange w-56 font-jakarta"
                          />
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setResubmittingId(null);
                                setResolutionRemarks("");
                              }}
                              className="px-2 py-0.5 text-[11px] text-sibs-muted hover:text-sibs-navy cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={!resolutionRemarks.trim()}
                              onClick={() => handleConfirmResubmit(app.id)}
                              className="sibs-btn-primary h-7 px-2.5 text-[11px] font-bold disabled:opacity-50 cursor-pointer"
                            >
                              Confirm Resubmit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setResubmittingId(app.id);
                            setResolutionRemarks("");
                          }}
                          className="sibs-btn-primary h-8 px-3.5 text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Resubmit to HR</span>
                        </button>
                      ))}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedApplicantId(app.id);
                        onOpenApplicantDetails(app);
                      }}
                      className="sibs-btn-secondary h-8 px-3 text-xs font-bold cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default NHOHandoffsView;
