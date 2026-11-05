import { useState } from "react";
import { useJourney } from "../JourneyContext";
import {
  RotateCcw,
  Layers,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
function ConfigurationView({ onSwitchModule }) {
  const {
    simulatedCurrentDate,
    setSimulatedCurrentDate,
    resetJourneysToDefault
  } = useJourney();
  const [dateInput, setDateInput] = useState(simulatedCurrentDate);
  const [toastMessage, setToastMessage] = useState(null);
  const handleUpdateDate = (e) => {
    e.preventDefault();
    setSimulatedCurrentDate(dateInput);
    setToastMessage(`Simulated system date set to ${dateInput}! Milestone timelines updated.`);
    setTimeout(() => setToastMessage(null), 3e3);
  };
  const [showConfirmResetModal, setShowConfirmResetModal] = useState(false);
  const handleConfirmReset = () => {
    resetJourneysToDefault();
    setDateInput("2026-10-14");
    setShowConfirmResetModal(false);
    setToastMessage("All Journey state, materials, assessments, and audit logs have been reset to default baseline.");
    setTimeout(() => setToastMessage(null), 3e3);
  };
  const roleOwnership = [
    ["Trainer", "Primary Days 1\u201314: training logs, readiness verification, first handoff request."],
    ["QDS / QA", "Independent scored QA audits, evidence sampling and quality rechecks; cannot edit Trainer assessments."],
    ["QDS Manager", "Cross-trainer and trainee oversight, comparative performance, QA verification and follow-up requests; no HR milestone approvals."],
    ["Team Leader", "Accept trainee handoff; own day-to-day work, check-ins, coaching plans, corrective actions."],
    ["Manager", "Own Day 30 / 60 / 90 performance decisions and operational support goals."],
    ["HR Coordinator", "Coordinate evidence; confirm Day 30 / 60 manager reviews; chase overdue approvals."],
    ["Employee", "View own journey and released evidence; submit experience check-ins and acknowledge Day 90 review."],
    ["HR Process Owner", "Finalize Day 90 onboarding outcome and route continuing support to PMS / HR."],
    ["HR Admin", "Configure templates, milestones, alerts and permission assignments; cross-organization governance."]
  ];
  const apiEndpoints = [
    "GET /api/employee-journeys",
    "GET /api/employee-journeys/:id",
    "POST /api/employee-journeys/:id/evidence",
    "GET /api/employee-journeys/performance/cohorts",
    "GET /api/employee-journeys/performance/trainers",
    "POST /api/employee-journeys/:id/performance-scores",
    "POST /api/employee-journeys/:id/qds-followups",
    "POST /api/employee-journeys/:id/check-ins",
    "POST /api/employee-journeys/:id/actions",
    "POST /api/employee-journeys/:id/reviews/:day",
    "POST /api/employee-journeys/:id/reviews/:day/confirm",
    "POST /api/employee-journeys/:id/handoffs",
    "POST /api/employee-journeys/:id/final-disposition"
  ];
  return <div className="space-y-6">
      {
    /* SiBS HRIS Standard Header: White card with top accent gradient bar */
  }
      <section className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white shadow-xs">
        <div className="h-[3.5px] w-full bg-gradient-to-r from-[#042C51] via-[#c24b30] to-[#FF5C28]" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-[#E9F0FC] px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#042C51]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C28]" />
              System Specification & Testing Controls
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#042C51]">
              Journey Configuration
            </h1>
            <p className="text-xs text-[#667085] max-w-3xl leading-normal">
              Role ownership specifications, proposed HRIS API endpoints, governance compliance rules, and time-travel demo testing controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
    type="button"
    onClick={() => setShowConfirmResetModal(true)}
    className="px-3.5 py-2 rounded-xl bg-[#E74C3C] hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
  >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Baseline</span>
            </button>

            {onSwitchModule && <button
    type="button"
    onClick={() => onSwitchModule("New Hire Orientation (NHO)")}
    className="px-3.5 py-2 rounded-xl border border-[#BECBDA] hover:bg-[#F7F9FC] text-[#042C51] font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
  >
                <Layers className="w-4 h-4 text-[#FF5C28]" />
                <span>Back to NHO</span>
              </button>}
          </div>
        </div>
      </section>

      {toastMessage && <div className="sibs-tone-green-bg border sibs-tone-green-border sibs-tone-green-text text-xs px-4 py-2.5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        </div>}

      {
    /* In-UI Reset Confirmation Modal */
  }
      {showConfirmResetModal && <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E6ECF2]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#042C51]">Confirm Demo Reset</h3>
                <p className="text-xs text-slate-500">Restore default sample data</p>
              </div>
            </div>

            <p className="text-xs text-[#042C51] leading-relaxed">
              Are you sure you want to reset all 30/60/90 Employee Journey data to pristine baseline state? All completed scorecards, logged feedback, and simulated dates will be reloaded.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
    type="button"
    onClick={() => setShowConfirmResetModal(false)}
    className="px-4 py-2 rounded-xl border border-[#BECBDA] bg-white hover:bg-[#F7F9FC] text-[#042C51] font-semibold text-xs transition-colors cursor-pointer"
  >
                Cancel
              </button>
              <button
    type="button"
    onClick={handleConfirmReset}
    className="px-4 py-2 rounded-xl bg-[#E74C3C] hover:bg-red-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
  >
                Yes, Reset Baseline
              </button>
            </div>
          </div>
        </div>}

      {
    /* Time-Travel Demo Testing Controls */
  }
      <div className="bg-white rounded-xl border border-[#E6ECF2] shadow-xs p-4 sm:p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold text-[#042C51]">Time-Travel Testing Controller</h2>
          <p className="text-xs text-slate-500">Change simulated current date to evaluate Day 30, Day 60, and Day 90 milestone evaluation rules.</p>
        </div>

        <form onSubmit={handleUpdateDate} className="flex flex-col sm:flex-row items-end gap-3">
          <div className="w-full sm:w-auto flex-1">
            <label className="block text-xs font-bold text-[#042C51] mb-1">Simulated System Date</label>
            <input
    type="date"
    value={dateInput}
    onChange={(e) => setDateInput(e.target.value)}
    className="w-full p-2.5 rounded-xl border border-[#BECBDA] text-xs font-bold text-[#042C51] outline-none focus:border-[#FF5C28]"
  />
          </div>

          <button
    type="submit"
    className="px-4 py-2.5 rounded-xl bg-[#FF5C28] hover:bg-[#e04f20] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
  >
            Apply Simulated Date
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {[
    { label: "Baseline (Oct 14)", date: "2026-10-14" },
    { label: "Day 30 (Nov 5)", date: "2026-11-05" },
    { label: "Day 60 (Dec 5)", date: "2026-12-05" },
    { label: "Day 90+ (Jan 15)", date: "2027-01-15" }
  ].map((p) => <button
    key={p.date}
    type="button"
    onClick={() => {
      setDateInput(p.date);
      setSimulatedCurrentDate(p.date);
      setToastMessage(`Simulated date jumped to ${p.label}!`);
      setTimeout(() => setToastMessage(null), 3e3);
    }}
    className="p-2.5 rounded-xl border border-[#E6ECF2] bg-[#F7F9FC] hover:bg-white hover:border-[#BECBDA] text-left transition-all cursor-pointer shadow-xs"
  >
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Preset</span>
              <strong className="text-xs font-bold text-[#042C51] block mt-0.5">{p.label}</strong>
            </button>)}
        </div>
      </div>

      {
    /* Role Ownership Specification */
  }
      <div className="bg-white rounded-xl border border-[#E6ECF2] shadow-xs p-4 sm:p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold text-[#042C51]">Role Ownership & Security Architecture</h2>
          <p className="text-xs text-slate-500">Access rules for trainers, QDS, team leaders, and HR administrators.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {roleOwnership.map(([role, desc], idx) => <div key={idx} className="p-3.5 rounded-xl border border-[#E6ECF2] bg-[#F7F9FC] space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#FF5C28]">{role}</span>
              <p className="text-[#042C51] font-medium">{desc}</p>
            </div>)}
        </div>
      </div>

      {
    /* Proposed HRIS API Endpoints */
  }
      <div className="bg-white rounded-xl border border-[#E6ECF2] shadow-xs p-4 sm:p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold text-[#042C51]">Proposed SiBS HRIS Integration Endpoints</h2>
          <p className="text-xs text-slate-500">Backend service contracts for persistent Employee Journey storage and multi-role operations.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          {apiEndpoints.map((ep, i) => <div key={i} className="p-2.5 rounded-xl border border-[#E6ECF2] bg-[#FAFCFF] text-[#042C51]">
              {ep}
            </div>)}
        </div>
      </div>
    </div>;
}
export {
  ConfigurationView as default
};
