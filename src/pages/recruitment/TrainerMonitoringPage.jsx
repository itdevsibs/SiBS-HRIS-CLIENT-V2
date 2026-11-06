import QdsRequestModal from "@/components/recruitment/journey/QdsRequestModal";
import { validateQdsRequest, visibleTrainerJourneys } from "@/lib/utils/journey/trainerMonitoringValidation";
import { useState } from "react";
import {
  AlertTriangle,
  Award,
  Check,
  CheckCircle2,
  Layers,
  Plus,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { MetricCard, MetricGrid, ModalShell, PageHeaderHero, SelectDropdown } from "@/components/ui";
import EmployeeJourneyModule from "@/components/recruitment/journey/EmployeeJourneyModule";
import { useJourney } from "@/components/recruitment/journey/JourneyContext";
import { averageAvailable, computeTraineePerformance } from "@/components/recruitment/journey/trainerCoachingUtils";
import { useDemoAuth, useHrisModuleNavigation } from "@/lib/utils/journey/hrisRoleAdapter";

export default function TrainerMonitoringPage() {
  const { user } = useDemoAuth();
  const [formError, setFormError] = useState("");
  const handleSwitchModule = useHrisModuleNavigation();

  const {
    journeys = [],
    phaseTrainingScores = [],
    assessmentGrades = [],
    assessments = [],
    evidence = [],
    attendance = [],
    assignments = [],
    progress = [],
    addQDSRequest,
    simulatedCurrentDate = "",
  } = useJourney();

  const [showQdsModal, setShowQdsModal] = useState(false);
  const [qdsTargetEmp, setQdsTargetEmp] = useState("");
  const [qdsType, setQdsType] = useState("Trainer coaching review");
  const [qdsNotes, setQdsNotes] = useState("");
  const [qdsDue, setQdsDue] = useState("2026-10-25");
  const [toastMessage, setToastMessage] = useState(null);

  const contextData = {
    phaseTrainingScores,
    assessmentGrades,
    assessments,
    evidence,
    attendance,
    assignments,
    progress,
    simulatedCurrentDate,
  };

  const visibleJourneys = visibleTrainerJourneys(journeys, user);
  const perfs = visibleJourneys.map((j) => computeTraineePerformance(j, contextData));
  const totalTrainees = visibleJourneys.length;
  const avgComposite = averageAvailable(perfs.map((p) => p.composite));
  const avgQA = averageAvailable(perfs.map((p) => p.qaScore));
  const supportCount = perfs.filter((p) => p.composite !== null && p.composite < 70).length;

  const handleCreateQdsRequest = (e) => {
    e.preventDefault();
    const error = validateQdsRequest({ trainees: visibleJourneys, target: qdsTargetEmp, type: qdsType, notes: qdsNotes, due: qdsDue });
    setFormError(error);
    if (error) return;
    const targetJourney = visibleJourneys.find((j) => (j.sibsEmployeeId || j.id) === qdsTargetEmp);
    addQDSRequest({
      emp: qdsTargetEmp || targetJourney?.sibsEmployeeId || targetJourney?.id || "SIBS-2901",
      trainer: targetJourney?.trainerName || "Maria Cruz",
      assignedTo: "Elena Santos (Quality Lead)",
      type: qdsType,
      notes: qdsNotes,
      due: qdsDue,
    });
    setToastMessage("QDS follow-up request submitted successfully!");
    setShowQdsModal(false);
    setQdsNotes("");
    setTimeout(() => setToastMessage(null), 3000);
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
            <div className="fixed top-6 right-6 z-[3000] sibs-toast-in bg-sibs-navy text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl border border-sibs-orange flex items-center gap-2">
              <Check className="w-4 h-4 text-sibs-orange" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* 1. HEADER WITH ACTIONS */}
          <PageHeaderHero
            kicker="Training & L&D Operations"
            title="Trainer Monitoring & Cohort Intelligence"
            description="Supervise trainer cohorts, evaluate FST/PST assessments, monitor QA calibrations, and track verified curriculum progression."
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
                  onClick={() => {
                    setQdsTargetEmp("");
                    setFormError("");
                    setShowQdsModal(true);
                  }}
                  className="sibs-btn-primary gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Request QDS Feedback</span>
                </button>
              </div>
            }
          />

          {/* 2. METRICS (Executive KPI Strip) */}
          <MetricGrid columns={4}>
            <MetricCard
              label="Supervised Trainees"
              value={totalTrainees}
              description="Active cohort assignments"
              tone="navy"
              icon={Users}
              delay={0}
            />
            <MetricCard
              label="Cohort Avg. Composite"
              value={avgComposite !== null ? `${avgComposite}%` : "Not assessed"}
              description="35% Training • 40% QA • 25% Sim"
              tone="orange"
              icon={Award}
              delay={50}
            />
            <MetricCard
              label="Independent QA Audit"
              value={avgQA !== null ? `${avgQA}%` : "Not assessed"}
              description="QDS calibration benchmark"
              tone="green"
              icon={CheckCircle2}
              delay={100}
            />
            <MetricCard
              label="Support Required"
              value={supportCount}
              description={supportCount === 1 ? "1 trainee < 70%" : `${supportCount} trainees < 70%`}
              tone={supportCount > 0 ? "red" : "amber"}
              icon={AlertTriangle}
              delay={150}
            />
          </MetricGrid>

          {/* 3. CORE TRAINER MONITORING MODULE */}
          <div
            className="sibs-page-card-in"
            style={{ animationDelay: "200ms", animationFillMode: "both" }}
          >
            <EmployeeJourneyModule
              defaultView="trainer-monitoring"
              onSwitchModule={handleSwitchModule}
            />
          </div>
        </div>
      </main>

      {/* Modal: Request QDS Review / Follow-Up (Triggered from Header) */}
      <QdsRequestModal trainees={visibleJourneys} formId="qds-request-form" error={formError} showQdsModal={showQdsModal} setShowQdsModal={setShowQdsModal} qdsTargetEmp={qdsTargetEmp} setQdsTargetEmp={setQdsTargetEmp} qdsType={qdsType} setQdsType={setQdsType} qdsNotes={qdsNotes} setQdsNotes={setQdsNotes} qdsDue={qdsDue} setQdsDue={setQdsDue} handleCreateQdsRequest={handleCreateQdsRequest} />
    </div>
  );
}
