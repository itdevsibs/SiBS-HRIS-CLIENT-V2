import { useState } from "react";
import {
  AlertTriangle,
  Award,
  Check,
  CheckCircle2,
  FileText,
  Layers,
  Plus,
  Send,
  Users,
} from "lucide-react";
import Header from "@/components/layout/Header";
import {
  MetricCard,
  MetricGrid,
  ModalShell,
  PageHeaderHero,
  SelectDropdown,
} from "@/components/ui";
import EmployeeJourneyModule from "@/components/recruitment/journey/EmployeeJourneyModule";
import { useJourney } from "@/components/recruitment/journey/JourneyContext";
import {
  coachingStatus,
  evaluationFor,
} from "@/components/recruitment/journey/trainerCoachingUtils";
import { useHrisModuleNavigation } from "@/lib/utils/journey/hrisRoleAdapter";

export default function ESEPCoachingPage() {
  const handleSwitchModule = useHrisModuleNavigation();

  const {
    journeys = [],
    esepSessions = [],
    esepEvaluations = [],
    addEsepSession,
    simulatedCurrentDate = "",
  } = useJourney();

  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(
    journeys[0]?.sibsEmployeeId || journeys[0]?.id || "SIBS-2901"
  );
  const [recordType, setRecordType] = useState("Weekly 1:1");
  const [recordFacilitator, setRecordFacilitator] = useState("Anton Reyes (Team Leader)");
  const [recordGoal, setRecordGoal] = useState("");
  const [recordActionPlan, setRecordActionPlan] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 4 Executive KPI Metrics
  const totalDocumentedSessions = esepSessions.length;
  const evaluatedCount = esepSessions.filter((s) => evaluationFor(s, esepEvaluations)).length;
  const weeklyTLCount = new Set(
    esepSessions.filter((s) => s.type === "Weekly 1:1").map((s) => s.emp)
  ).size;
  const overdueCount = esepSessions.filter(
    (s) => coachingStatus(s, esepEvaluations, simulatedCurrentDate) === "Overdue"
  ).length;

  const handleRecordSubmit = (e) => {
    e.preventDefault();
    if (!recordGoal.trim() || !recordActionPlan.trim()) return;

    const targetEmp =
      journeys.find((j) => (j.sibsEmployeeId || j.id) === selectedEmpId) || journeys[0];

    if (addEsepSession) {
      addEsepSession({
        id: Date.now(),
        emp: targetEmp?.sibsEmployeeId || targetEmp?.id || "SIBS-2901",
        type: recordType,
        date: simulatedCurrentDate || "2026-10-18",
        facilitator: recordFacilitator.split(" (")[0],
        facilitatorRole: recordFacilitator.includes("Team Leader")
          ? "Team Leader"
          : recordFacilitator.includes("QDS")
          ? "QDS / QA"
          : "Trainer",
        goal: recordGoal,
        reality: "Identified developmental focus area during operational performance review",
        options: "Targeted skill calibration & active role-play scenario practice",
        will: recordActionPlan,
        actionPlan: recordActionPlan,
        due: "2026-10-25",
        qaParameters: ["Information Accuracy", "Resolution Completeness"],
      });
    }

    triggerToast("New GROW Coaching session recorded and added to development evidence!");
    setShowRecordModal(false);
    setRecordGoal("");
    setRecordActionPlan("");
  };

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-3.5 sm:space-y-4 2xl:space-y-5">
          {/* Toast Notification */}
          {toastMessage && (
            <div
              role="status"
              className="fixed top-6 right-6 z-[3000] sibs-toast-in flex items-center gap-2.5 rounded-xl border border-sibs-orange bg-sibs-navy px-4 py-3 text-xs font-bold text-white shadow-xl"
            >
              <Check className="h-4 w-4 text-sibs-orange shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* 1. PAGE HEADER HERO WITH ACTIONS */}
          <PageHeaderHero
            kicker="Employee Development & QA"
            title="ESEP Coaching & GROW Evaluation"
            description="Track coaching sessions, GROW framework action plans, 23 QA evaluation parameters, and probationary performance progression."
            actions={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSwitchModule("New Hire Orientation (NHO)")}
                  className="sibs-btn-secondary gap-1.5 cursor-pointer"
                  title="Back to NHO"
                >
                  <Layers size={14} className="text-sibs-orange" />
                  <span className="hidden sm:inline">Back to NHO</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerToast("TL EOD summary compiled and verified for today's coaching logs.")}
                  className="sibs-btn-secondary gap-1.5 cursor-pointer"
                  title="Submit TL EOD Report"
                >
                  <FileText size={14} className="text-sibs-navy" />
                  <span className="hidden sm:inline">Submit TL EOD Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowRecordModal(true)}
                  className="sibs-btn-primary gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Record GROW Coaching</span>
                </button>
              </div>
            }
          />

          {/* 2. EXECUTIVE METRIC KPI STRIP */}
          <MetricGrid columns={4}>
            <MetricCard
              label="Documented Sessions"
              value={totalDocumentedSessions}
              description="Documented GROW coaching logs"
              tone="navy"
              icon={FileText}
              delay={0}
            />
            <MetricCard
              label="Follow-ups Evaluated"
              value={evaluatedCount}
              description="Completed outcome reviews"
              tone="green"
              icon={CheckCircle2}
              delay={50}
            />
            <MetricCard
              label="Weekly TL 1-on-1s"
              value={`${weeklyTLCount} / ${journeys.length || 6}`}
              description="Required once per CSR per week"
              tone="orange"
              icon={Users}
              delay={100}
            />
            <MetricCard
              label="Overdue Reviews"
              value={overdueCount}
              description={overdueCount === 0 ? "Zero overdue follow-ups" : "Past due follow-up reviews"}
              tone={overdueCount > 0 ? "red" : "green"}
              icon={AlertTriangle}
              delay={150}
            />
          </MetricGrid>

          {/* 3. CORE ESEP COACHING DASHBOARD MODULE */}
          <div
            className="sibs-page-card-in"
            style={{ animationDelay: "200ms", animationFillMode: "both" }}
          >
            <EmployeeJourneyModule
              defaultView="esep-coaching"
              onSwitchModule={handleSwitchModule}
            />
          </div>
        </div>
      </main>

      {/* MODAL: RECORD ESEP GROW COACHING */}
      <ModalShell
        open={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        variant="navy"
        maxWidth="max-w-xl"
        icon={Award}
        title="Record ESEP GROW Coaching"
        subtitle="Document formal GROW coaching session and action plan"
        bodyClassName="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-5 font-jakarta space-y-4"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowRecordModal(false)}
              className="sibs-modal-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="page-record-grow-form"
              className="sibs-modal-btn-primary"
            >
              <Send size={13} />
              <span>Save Coaching Record</span>
            </button>
          </div>
        }
      >
        <form id="page-record-grow-form" onSubmit={handleRecordSubmit} className="space-y-4 text-xs font-jakarta">
          <SelectDropdown
            label="Target Coachee / Employee"
            value={selectedEmpId}
            onChange={setSelectedEmpId}
            searchable
            options={journeys.map((j) => ({
              value: j.sibsEmployeeId || j.id,
              label: `${j.fullName} (${j.sibsEmployeeId || j.id}) • ${j.account || "Operations"} (TL: ${j.tl || "Anton Reyes"})`,
            }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectDropdown
              label="Session Type"
              value={recordType}
              onChange={setRecordType}
              options={[
                { value: "Weekly 1:1", label: "Weekly 1:1" },
                { value: "QA-triggered", label: "QA-triggered" },
                { value: "Ad-hoc Support", label: "Ad-hoc Support" },
              ]}
            />
            <SelectDropdown
              label="Facilitator"
              value={recordFacilitator}
              onChange={setRecordFacilitator}
              options={[
                { value: "Anton Reyes (Team Leader)", label: "Anton Reyes (Team Leader)" },
                { value: "Rico Torres (Team Leader)", label: "Rico Torres (Team Leader)" },
                { value: "Elena Santos (QDS / QA Lead)", label: "Elena Santos (QDS / QA Lead)" },
                { value: "Ella Lim (QDS / QA)", label: "Ella Lim (QDS / QA)" },
                { value: "Maria Cruz (Assigned Trainer)", label: "Maria Cruz (Assigned Trainer)" },
              ]}
            />
          </div>

          <div>
            <label className="sibs-modal-field-label">G • Coaching Goal</label>
            <input
              type="text"
              required
              placeholder="e.g. Improve case resolution confidence & documentation accuracy"
              value={recordGoal}
              onChange={(e) => setRecordGoal(e.target.value)}
              className="sibs-modal-input"
            />
          </div>

          <div>
            <label className="sibs-modal-field-label">W • Agreed Action / Way Forward</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Practice 2 case scenarios with TL and apply the checklist on next monitored calls"
              value={recordActionPlan}
              onChange={(e) => setRecordActionPlan(e.target.value)}
              className="sibs-modal-textarea"
            />
          </div>

          <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border text-xs space-y-1">
            <span className="sibs-text-micro font-extrabold text-sibs-navy uppercase tracking-wider block">
              GROW Framework Notice:
            </span>
            <p className="sibs-text-micro text-sibs-muted">
              Saving will log this session as formal developmental evidence under the coachee's probationary record and schedule supervisor follow-up tracking.
            </p>
          </div>
        </form>
      </ModalShell>
    </div>
  );
}
