/**
 * QDS Dashboard Helper Utilities
 * Pure functions for metric normalization, trainer calibration calculation,
 * cohort progression funnel derivation, and Pattern B filtering.
 */

export const EMPTY_QDS_METRICS = Object.freeze({
  totalTrainees: 0,
  qaPassRate: 0,
  calibrationGaps: 0,
  pendingAudits: 0,
  avgComposite: 0,
  avgTrainerScore: 0,
  avgQaScore: 0,
  funnel: {
    nho: 0,
    fst: 0,
    pst: 0,
    nesting: 0,
    floorReady: 0,
    dropouts: 0,
    conversionRate: 0,
  },
  trainerSummaries: [],
  trainees: [],
});

export function cleanText(value) {
  return String(value ?? "").trim();
}

export function formatPercent(value, fallback = "0%") {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return `${Math.round(num)}%`;
}

export function formatScore(value, fallback = "—") {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return `${Math.round(num * 10) / 10}%`;
}

export function averageAvailable(scores = []) {
  const valid = scores
    .map(Number)
    .filter((v) => Number.isFinite(v) && v >= 0);
  if (!valid.length) return null;
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  return Math.round((sum / valid.length) * 10) / 10;
}

/**
 * Derives trainee performance composite scores and attendance adherence
 */
export function calculateTraineeQualityScore(trainee = {}) {
  const trScore = trainee.trainerScore ?? trainee.fstScore ?? null;
  const qaScore = trainee.qaScore ?? trainee.independentQaScore ?? null;
  const simScore = trainee.simScore ?? trainee.workSimScore ?? null;

  // Composite: 35% Trainer assessment + 40% QDS Independent QA + 25% Work simulation
  let composite = null;
  if (trScore !== null && qaScore !== null && simScore !== null) {
    composite = Math.round(trScore * 0.35 + qaScore * 0.4 + simScore * 0.25);
  } else if (trScore !== null && qaScore !== null) {
    composite = Math.round(trScore * 0.45 + qaScore * 0.55);
  } else if (qaScore !== null) {
    composite = Math.round(qaScore);
  } else if (trScore !== null) {
    composite = Math.round(trScore);
  }

  const gap =
    trScore !== null && qaScore !== null ? Math.round(trScore - qaScore) : null;

  return {
    trainerScore: trScore,
    qaScore,
    simScore,
    composite,
    calibrationGap: gap,
    needsSupport: composite !== null && composite < 70,
    highPerformer: composite !== null && composite >= 85,
  };
}

/**
 * Summarizes trainer effectiveness and calibration variance across assigned trainees
 */
export function deriveTrainerSummaries(trainees = []) {
  const byTrainer = new Map();

  for (const trainee of trainees) {
    const trainerName = cleanText(trainee.trainerName) || "Unassigned";
    if (!byTrainer.has(trainerName)) {
      byTrainer.set(trainerName, []);
    }
    byTrainer.get(trainerName).push(trainee);
  }

  const summaries = [];

  for (const [trainerName, cohort] of byTrainer.entries()) {
    const scoredTrainees = cohort.map(calculateTraineeQualityScore);

    const validComposites = scoredTrainees
      .map((t) => t.composite)
      .filter((v) => v !== null);
    const validQa = scoredTrainees
      .map((t) => t.qaScore)
      .filter((v) => v !== null);
    const validTr = scoredTrainees
      .map((t) => t.trainerScore)
      .filter((v) => v !== null);

    const meanComposite = averageAvailable(validComposites);
    const meanQa = averageAvailable(validQa);
    const meanTr = averageAvailable(validTr);

    const calibrationGap =
      meanTr !== null && meanQa !== null
        ? Math.round(meanTr - meanQa)
        : null;

    const highCount = scoredTrainees.filter((t) => t.highPerformer).length;
    const supportCount = scoredTrainees.filter((t) => t.needsSupport).length;

    const attendanceRates = cohort
      .map((t) => Number(t.attendanceRate))
      .filter((v) => Number.isFinite(v) && v >= 0);
    const avgAttendance = averageAvailable(attendanceRates) ?? 95;

    summaries.push({
      trainerName,
      traineeCount: cohort.length,
      scoredCount: validComposites.length,
      meanComposite,
      meanQa,
      meanTr,
      calibrationGap,
      hasLargeGap: calibrationGap !== null && Math.abs(calibrationGap) >= 10,
      highCount,
      supportCount,
      avgAttendance,
      pendingRequests: cohort.filter(
        (t) => t.auditStatus === "Pending" || t.coachingStatus === "Overdue",
      ).length,
    });
  }

  return summaries.sort((a, b) => b.traineeCount - a.traineeCount);
}

/**
 * Computes cohort progression funnel from Day 1 to Floor Readiness
 */
export function deriveCohortProgressionFunnel(trainees = []) {
  const total = trainees.length;
  if (!total) {
    return {
      nho: 0,
      fst: 0,
      pst: 0,
      nesting: 0,
      floorReady: 0,
      dropouts: 0,
      conversionRate: 0,
    };
  }

  let nho = 0;
  let fst = 0;
  let pst = 0;
  let nesting = 0;
  let floorReady = 0;
  let dropouts = 0;

  for (const t of trainees) {
    const phase = cleanText(t.trainingPhase || t.stage || "").toLowerCase();
    const status = cleanText(t.status || "").toLowerCase();

    if (status.includes("drop") || status.includes("attrit") || status.includes("failed")) {
      dropouts++;
      continue;
    }

    if (phase.includes("nho") || phase.includes("orientation")) {
      nho++;
    } else if (phase.includes("fst") || phase.includes("foundational")) {
      fst++;
    } else if (phase.includes("pst") || phase.includes("product")) {
      pst++;
    } else if (phase.includes("nesting") || phase.includes("day 30") || phase.includes("ramp")) {
      nesting++;
    } else if (phase.includes("floor") || phase.includes("ready") || phase.includes("completed")) {
      floorReady++;
    } else {
      nho++;
    }
  }

  const activeTrainees = total - dropouts;
  const conversionRate =
    total > 0 ? Math.round(((total - dropouts) / total) * 100) : 0;

  return {
    nho,
    fst,
    pst,
    nesting,
    floorReady,
    dropouts,
    activeTrainees,
    conversionRate,
  };
}

/**
 * Filter trainees based on Pattern B controls
 */
export function filterQdsTrainees(
  trainees = [],
  { search = "", trainer = "All", phase = "All", account = "All" } = {},
) {
  const query = cleanText(search).toLowerCase();
  const targetTrainer = cleanText(trainer);
  const targetPhase = cleanText(phase);
  const targetAccount = cleanText(account);

  return trainees.filter((t) => {
    // Search query matches name, SIBS ID, trainer, account, or role
    if (query) {
      const matchName = cleanText(t.fullName || t.name).toLowerCase().includes(query);
      const matchId = cleanText(t.sibsEmployeeId || t.sibsId || t.id).toLowerCase().includes(query);
      const matchTrainer = cleanText(t.trainerName).toLowerCase().includes(query);
      const matchAccount = cleanText(t.account).toLowerCase().includes(query);
      const matchRole = cleanText(t.role || t.position).toLowerCase().includes(query);

      if (!matchName && !matchId && !matchTrainer && !matchAccount && !matchRole) {
        return false;
      }
    }

    // Trainer Filter
    if (targetTrainer && targetTrainer !== "All") {
      if (cleanText(t.trainerName) !== targetTrainer) {
        return false;
      }
    }

    // Phase Filter
    if (targetPhase && targetPhase !== "All") {
      const currentPhase = cleanText(t.trainingPhase || t.stage);
      if (currentPhase !== targetPhase) {
        return false;
      }
    }

    // Account Filter
    if (targetAccount && targetAccount !== "All") {
      if (cleanText(t.account) !== targetAccount) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Paginates trainees safely with page boundary clamps
 */
export function paginateQdsTrainees(items = [], page = 1, limit = 15) {
  const total = items.length;
  const safeLimit = Math.max(1, Number(limit) || 15);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);

  const start = (safePage - 1) * safeLimit;
  const paginatedItems = items.slice(start, start + safeLimit);

  return {
    items: paginatedItems,
    pagination: {
      currentPage: safePage,
      totalPages,
      total,
      limit: safeLimit,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}
