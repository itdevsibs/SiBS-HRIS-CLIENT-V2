import { useCallback, useEffect, useState, useMemo } from "react";
import {
  GraduationCap,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { PageHeaderHero } from "@/components/ui";
import {
  QDSDashboardStats,
  QDSTrainerCalibration,
  QDSTrainingFunnel,
  QDSTraineeAuditTable,
  QDSDashboardSkeleton,
  QDSFollowUpQueue,
  QDSEsepEvidence,
  QDSCreateRequestModal,
} from "@/components/Dashboard/QDSDashboard";
import TrainerCoachingDetailsModal from "@/components/recruitment/journey/TrainerCoachingDetailsModal";
import { useJourney } from "@/components/recruitment/journey/JourneyContext";
import {
  getQdsDashboardBootstrap,
  buildFallbackQdsBootstrap,
} from "@/lib/axios/getQdsDashboard";
import { formatHrisDateLocalized } from "@/lib/axios/dateFormatter";
import {
  useHrisModuleNavigation,
  useDemoAuth,
} from "@/lib/utils/journey/hrisRoleAdapter";

function formatLastUpdated(date) {
  if (!date) return "Just now";
  try {
    return formatHrisDateLocalized(date, "en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      month: "short",
      day: "numeric",
    });
  } catch (_e) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
}

export default function QDSDashboardPage() {
  const handleSwitchModule = useHrisModuleNavigation();
  const { user } = useDemoAuth();
  const canManageQdsRequests = ["QDS", "Super Admin", "HR Admin", "HR", "TA"].includes(
    user?.role || ""
  );

  const {
    journeys = [],
    qdsRequests = [],
    esepSessions = [],
    esepEvaluations = [],
    addQDSRequest,
    updateQDSRequestStatus,
    simulatedCurrentDate = "2026-10-25",
  } = useJourney();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState("All");

  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [coachingEmployee, setCoachingEmployee] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const loadDashboardData = useCallback(async ({ forceRefresh = false } = {}) => {
    if (forceRefresh) {
      setRefreshing(true);
    }
    try {
      const response = await getQdsDashboardBootstrap({ forceRefresh });
      if (response?.data) {
        setDashboardData(response.data);
      } else {
        const fallback = buildFallbackQdsBootstrap();
        setDashboardData(fallback.data);
      }
      setLastRefreshed(new Date());
    } catch (_err) {
      const fallback = buildFallbackQdsBootstrap();
      setDashboardData(fallback.data);
      setLastRefreshed(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefreshClick = () => {
    loadDashboardData({ forceRefresh: true });
  };

  const handleCreateRequest = (req) => {
    addQDSRequest?.(req);
    setToastMessage("Quality follow-up request created successfully!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResolveRequest = (id) => {
    updateQDSRequestStatus?.(id, "Closed", "Quality review complete.");
    setToastMessage("QDS follow-up marked as resolved.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const metrics = dashboardData?.metrics || {};
  const trainerSummaries = dashboardData?.trainerSummaries || [];
  const funnel = metrics.funnel || {};
  const trainees = dashboardData?.trainees || [];

  const activeTraineesList = useMemo(() => {
    return journeys.length > 0 ? journeys : trainees;
  }, [journeys, trainees]);

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-3.5 sm:space-y-4 2xl:space-y-5">
          {/* Tier 1: Identity & Context Horizon */}
          <PageHeaderHero
            kicker="Quality Development Specialist (QDS)"
            title="QDS Dashboard & Training Quality Oversight"
            description="Real-time trainee audit matrix, trainer effectiveness signals, independent QA scores, calibration variance, and cohort progression."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshClick}
                  disabled={refreshing || loading}
                  className="sibs-btn-secondary gap-1.5 cursor-pointer disabled:opacity-60"
                  title={`Last updated: ${formatLastUpdated(lastRefreshed)}`}
                >
                  <RefreshCw
                    size={14}
                    className={`text-sibs-navy ${refreshing ? "animate-spin text-sibs-orange" : ""}`}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchModule("New Hire Orientation (NHO)")}
                  className="sibs-btn-secondary gap-1.5 cursor-pointer"
                  title="Navigate to New Hire Orientation"
                >
                  <Sparkles size={14} className="text-sibs-orange" />
                  <span>NHO Module</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchModule("ESEP Coaching")}
                  className="sibs-btn-secondary gap-1.5 cursor-pointer"
                  title="Navigate to ESEP Coaching"
                >
                  <GraduationCap size={14} className="text-sibs-navy" />
                  <span>ESEP Coaching</span>
                </button>

                {canManageQdsRequests && (
                  <button
                    type="button"
                    onClick={() => setShowNewRequestModal(true)}
                    className="sibs-btn-primary gap-1.5 cursor-pointer shadow-xs"
                    title="Create new quality follow-up request"
                  >
                    <ShieldCheck size={14} className="text-white" />
                    <span>New Quality Request</span>
                  </button>
                )}
              </div>
            }
          />

          {/* Toast Notification */}
          {toastMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {loading && !dashboardData ? (
            <QDSDashboardSkeleton showHero={false} showMetrics={true} />
          ) : (
            <div className="space-y-4 sm:space-y-5 2xl:space-y-6">
              {/* Tier 2: Executive Horizon Pulse Metrics */}
              <QDSDashboardStats
                metrics={metrics}
                loading={loading}
              />

              {/* Tier 3: Strategic Analytics Gateway (Dual-Column) */}
              <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
                <div
                  className="sibs-page-card-in min-w-0"
                  style={{ animationDelay: "200ms", animationFillMode: "both" }}
                >
                  <QDSTrainerCalibration
                    trainerSummaries={trainerSummaries}
                    loading={loading}
                    selectedTrainer={selectedTrainer}
                    onTrainerSelect={setSelectedTrainer}
                  />
                </div>

                <div
                  className="sibs-page-card-in min-w-0"
                  style={{ animationDelay: "240ms", animationFillMode: "both" }}
                >
                  <QDSTrainingFunnel
                    funnel={funnel}
                    loading={loading}
                  />
                </div>
              </div>

              {/* Tier 4: Tactical Ground Level Audit Matrix Table */}
              <div
                className="sibs-page-card-in min-w-0"
                style={{ animationDelay: "280ms", animationFillMode: "both" }}
              >
                <QDSTraineeAuditTable
                  trainees={trainees}
                  loading={loading}
                  trainerSummaries={trainerSummaries}
                  initialTrainer={selectedTrainer}
                />
              </div>

              {/* Tier 5: Quality & Coaching Follow-Up Queue */}
              <div
                className="sibs-page-card-in min-w-0"
                style={{ animationDelay: "340ms", animationFillMode: "both" }}
              >
                <QDSFollowUpQueue
                  requests={qdsRequests}
                  journeys={activeTraineesList}
                  canManage={canManageQdsRequests}
                  onCreateRequest={() => setShowNewRequestModal(true)}
                  onResolveRequest={handleResolveRequest}
                />
              </div>

              {/* Tier 6: ESEP · Development Evidence (Trainee Coaching Results) */}
              <div
                className="sibs-page-card-in min-w-0"
                style={{ animationDelay: "400ms", animationFillMode: "both" }}
              >
                <QDSEsepEvidence
                  trainees={activeTraineesList}
                  sessions={esepSessions}
                  evaluations={esepEvaluations}
                  simulatedCurrentDate={simulatedCurrentDate}
                  onViewCoachingDetails={(trainee) => setCoachingEmployee(trainee)}
                />
              </div>
            </div>
          )}

          {/* Modal: Create Quality Request */}
          <QDSCreateRequestModal
            open={showNewRequestModal}
            onClose={() => setShowNewRequestModal(false)}
            onSubmit={handleCreateRequest}
            trainees={activeTraineesList}
            defaultDate={simulatedCurrentDate}
          />

          {/* Modal: Trainer Coaching Details Drill-Down */}
          {coachingEmployee && (
            <TrainerCoachingDetailsModal
              employee={coachingEmployee}
              sessions={esepSessions}
              evaluations={esepEvaluations}
              asOf={simulatedCurrentDate}
              onClose={() => setCoachingEmployee(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
