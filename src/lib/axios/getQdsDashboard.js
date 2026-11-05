import api from "./api-template";
import {
  deriveCohortProgressionFunnel,
  deriveTrainerSummaries,
  calculateTraineeQualityScore,
} from "../utils/Dashboards/QDSDashboard/qdsDashboardHelpers";

// In-memory cache with 60-second TTL matching TA and OM dashboards
let cachedBootstrap = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

export const DEFAULT_QDS_TRAINEES = [
  {
    id: "TRN-2026-001",
    sibsEmployeeId: "SIBS-2901",
    fullName: "Alyssa Rivera",
    account: "Fintech Core Banking",
    trainerName: "Elena Santos (Quality Lead)",
    trainingPhase: "Day 30 Nesting",
    trainerScore: 89,
    qaScore: 88,
    simScore: 92,
    attendanceRate: 98,
    auditStatus: "Completed",
    coachingStatus: "Evaluated",
    lastAuditDate: "2026-10-24",
  },
  {
    id: "TRN-2026-002",
    sibsEmployeeId: "SIBS-2902",
    fullName: "Theresa Mae Santos",
    account: "Healthcare Patient Support",
    trainerName: "Marcus Vance (Senior Trainer)",
    trainingPhase: "PST",
    trainerScore: 94,
    qaScore: 78,
    simScore: 80,
    attendanceRate: 92,
    auditStatus: "Pending",
    coachingStatus: "Overdue",
    lastAuditDate: "2026-10-22",
  },
  {
    id: "TRN-2026-003",
    sibsEmployeeId: "SIBS-2903",
    fullName: "Joshua De Leon",
    account: "E-Commerce Global Logistics",
    trainerName: "Elena Santos (Quality Lead)",
    trainingPhase: "Floor Ready",
    trainerScore: 91,
    qaScore: 90,
    simScore: 88,
    attendanceRate: 100,
    auditStatus: "Completed",
    coachingStatus: "Evaluated",
    lastAuditDate: "2026-10-25",
  },
  {
    id: "TRN-2026-004",
    sibsEmployeeId: "SIBS-2904",
    fullName: "Patricia Nicole Reyes",
    account: "Retail Customer Experience",
    trainerName: "Rachel Cruz (Product Specialist)",
    trainingPhase: "FST",
    trainerScore: 86,
    qaScore: 85,
    simScore: 84,
    attendanceRate: 96,
    auditStatus: "Completed",
    coachingStatus: "None",
    lastAuditDate: "2026-10-20",
  },
  {
    id: "TRN-2026-005",
    sibsEmployeeId: "SIBS-2905",
    fullName: "Gabriel Angelo Ramos",
    account: "Fintech Core Banking",
    trainerName: "Marcus Vance (Senior Trainer)",
    trainingPhase: "PST",
    trainerScore: 76,
    qaScore: 68,
    simScore: 70,
    attendanceRate: 88,
    auditStatus: "Pending",
    coachingStatus: "Awaiting evaluation",
    lastAuditDate: "2026-10-23",
  },
  {
    id: "TRN-2026-006",
    sibsEmployeeId: "SIBS-2906",
    fullName: "Janice Bautista",
    account: "Healthcare Patient Support",
    trainerName: "Rachel Cruz (Product Specialist)",
    trainingPhase: "NHO",
    trainerScore: 90,
    qaScore: 89,
    simScore: 88,
    attendanceRate: 100,
    auditStatus: "Completed",
    coachingStatus: "None",
    lastAuditDate: "2026-10-25",
  },
  {
    id: "TRN-2026-007",
    sibsEmployeeId: "SIBS-2907",
    fullName: "Christian Paul Mendoza",
    account: "E-Commerce Global Logistics",
    trainerName: "Marcus Vance (Senior Trainer)",
    trainingPhase: "Day 30 Nesting",
    trainerScore: 92,
    qaScore: 81,
    simScore: 85,
    attendanceRate: 94,
    auditStatus: "Pending",
    coachingStatus: "Awaiting evaluation",
    lastAuditDate: "2026-10-21",
  },
  {
    id: "TRN-2026-008",
    sibsEmployeeId: "SIBS-2908",
    fullName: "Kaye Kimberly Tan",
    account: "Retail Customer Experience",
    trainerName: "Elena Santos (Quality Lead)",
    trainingPhase: "Floor Ready",
    trainerScore: 95,
    qaScore: 94,
    simScore: 96,
    attendanceRate: 100,
    auditStatus: "Completed",
    coachingStatus: "Evaluated",
    lastAuditDate: "2026-10-25",
  },
];

export function buildFallbackQdsBootstrap() {
  const trainees = DEFAULT_QDS_TRAINEES.map((t) => ({
    ...t,
    ...calculateTraineeQualityScore(t),
  }));

  const trainerSummaries = deriveTrainerSummaries(trainees);
  const funnel = deriveCohortProgressionFunnel(trainees);

  const passingTrainees = trainees.filter(
    (t) => t.qaScore !== null && t.qaScore >= 85,
  );
  const scoredTrainees = trainees.filter((t) => t.qaScore !== null);
  const qaPassRate = scoredTrainees.length
    ? Math.round((passingTrainees.length / scoredTrainees.length) * 100)
    : 0;

  const calibrationGaps = trainerSummaries.filter((s) => s.hasLargeGap).length;
  const pendingAudits = trainees.filter((t) => t.auditStatus === "Pending").length;

  return {
    success: true,
    data: {
      metrics: {
        totalTrainees: trainees.length,
        qaPassRate,
        calibrationGaps,
        pendingAudits,
        funnel,
      },
      trainerSummaries,
      trainees,
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function getQdsDashboardBootstrap({ forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && cachedBootstrap && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedBootstrap;
  }

  try {
    const response = await api.get("/api/qds-dashboard/bootstrap", {
      params: {
        forceRefresh: forceRefresh ? "1" : undefined,
      },
      withCredentials: true,
      timeout: 10000,
    });

    if (response?.data?.success && response?.data?.data) {
      cachedBootstrap = response.data;
      cacheTimestamp = now;
      return cachedBootstrap;
    }
    throw new Error("Invalid response format from QDS bootstrap endpoint");
  } catch (_error) {
    // Graceful offline/prototype fallback to ensure seamless local operation
    const fallback = buildFallbackQdsBootstrap();
    cachedBootstrap = fallback;
    cacheTimestamp = now;
    return fallback;
  }
}
