import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react";

const EDGE = "rounded-[10px]";
const CARD_BORDER = "border border-[#E8EEF5]";

function toNumber(value) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getPositiveNumber(value) {
  const numberValue = toNumber(value);

  if (!Number.isFinite(numberValue)) return 0;

  return Math.abs(numberValue);
}

function formatNumber(value) {
  return toNumber(value).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function formatPercent(value, decimals = 0) {
  return `${toNumber(value).toFixed(decimals)}%`;
}

function formatAnimatedValue(value, decimals = 0, suffix = "") {
  const cleanValue = toNumber(value);

  return `${cleanValue.toLocaleString("en-PH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;
}

function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  duration = 650,
  className = "",
}) {
  const [displayValue, setDisplayValue] = useState(toNumber(value));

  useEffect(() => {
    const target = toNumber(value);
    const start = toNumber(displayValue);
    const difference = target - start;

    if (difference === 0) return undefined;

    let frameId = 0;
    const startTime = performance.now();

    function animateNumber(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = start + difference * easedProgress;

      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(animateNumber);
      } else {
        setDisplayValue(target);
      }
    }

    frameId = requestAnimationFrame(animateNumber);

    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return (
    <span className={`inline-block tabular-nums ${className}`}>
      {formatAnimatedValue(displayValue, decimals, suffix)}
    </span>
  );
}

function getNumberValue(item, keys = [], fallback = 0) {
  for (const key of keys) {
    const value = item?.[key];

    if (value !== undefined && value !== null && value !== "") {
      const numberValue = Number(value);

      if (Number.isFinite(numberValue)) {
        return numberValue;
      }
    }
  }

  return toNumber(fallback);
}

function getRequiredHeadcount(item = {}) {
  return getNumberValue(item, [
    "requiredHeadcount",
    "required_headcount",
    "requiredHC",
    "required_hc",
    "clientPlan",
    "client_plan",
  ]);
}

function getActualHeadcount(item = {}) {
  return getNumberValue(item, [
    "actualHeadcount",
    "actual_headcount",
    "actualHC",
    "actual_hc",
    "endorsedHeadcount",
    "endorsed_headcount",
  ]);
}

function getAbsenteeismTotal(item = {}) {
  return getNumberValue(item, [
    "absenteeismCount",
    "absenteeism_count",
    "absenteeismPastSixWeeks",
    "absenteeism_past_six_weeks",
    "absenteeismSixWeeks",
    "absenteeism_6_weeks",
    "totalAbsenteeism",
    "total_absenteeism",
  ]);
}

function getAttritionTotal(item = {}) {
  return getNumberValue(item, [
    "attritionPastCount",
    "attrition_past_count",
    "attritionCount",
    "attrition_count",
    "attritionPastSixWeeks",
    "attrition_past_six_weeks",
    "attritionSixWeeks",
    "attrition_6_weeks",
    "totalAttrition",
    "total_attrition",
  ]);
}

function getCoverageValue(item = {}) {
  /*
    Coverage should be computed from the row values by default:
    Coverage = MAX(0, Required HC - (Actual HC - Absenteeism - Attrition))

    This fixes the zero issue caused by treating missing direct coverage fields
    as 0 before the formula could run.
  */
  const requiredHeadcount = getRequiredHeadcount(item);
  const actualHeadcount = getActualHeadcount(item);
  const absenteeismTotal = getAbsenteeismTotal(item);
  const attritionTotal = getAttritionTotal(item);

  return Math.max(
    0,
    requiredHeadcount - (actualHeadcount - absenteeismTotal - attritionTotal),
  );
}

function getNhoCount(item = {}) {
  return getNumberValue(item, [
    "nhoCount",
    "nho_count",
    "nhoPopulationCount",
    "nho_population_count",
    "newHireOrientationCount",
    "new_hire_orientation_count",
  ]);
}

function getFstCount(item = {}) {
  return getNumberValue(item, [
    "fstCount",
    "fst_count",
    "fstPopulationCount",
    "fst_population_count",
  ]);
}

function getPstCount(item = {}) {
  return getNumberValue(item, [
    "pstCount",
    "pst_count",
    "pstPopulationCount",
    "pst_population_count",
  ]);
}

function getProjectedFromTraining(item = {}) {
  const directProjected = getNumberValue(
    item,
    [
      "projectedCoverageFromTraining",
      "projected_coverage_from_training",
      "projectedFromTraining",
      "projected_from_training",
      "trainingProjectedCoverage",
      "training_projected_coverage",
      "projectedToBeEndorsed",
      "projected_to_be_endorsed",
      "projectedEndorsed",
      "projected_endorsed",
      "pstEndorsedCount",
      "pst_endorsed_count",
    ],
    0,
  );

  if (directProjected > 0) return directProjected;

  const pstCount = getPstCount(item);
  const fstToPstAttrition = getNumberValue(item, [
    "attritionFstToPstCount",
    "attrition_fst_to_pst_count",
  ]);

  return Math.max(0, pstCount - fstToPstAttrition);
}

function getHiringNeeded(item = {}) {
  return getNumberValue(item, [
    "hiringNeeded",
    "hiring_needed",
    "actualHeadcountNeeds",
    "actual_headcount_needs",
    "projectedEmployeeNeeds",
    "projected_employee_needs",
    "opsPrf",
    "ops_prf",
  ]);
}

function getLeadsToInterview(item = {}) {
  return getNumberValue(item, [
    "leadsToInterview",
    "leads_to_interview",
    "leadsNeeded",
    "leads_needed",
  ]);
}

function getHiringIntakeCount(item = {}) {
  return getNumberValue(item, [
    "hiringIntakeCount",
    "hiring_intake_count",
    "intakeCount",
    "intake_count",
    "personnelRequisitionCount",
    "personnel_requisition_count",
    "prfCount",
    "prf_count",
    "totalPrf",
    "total_prf",
    "totalPRF",
    "requisitionCount",
    "requisition_count",
    "hiringNeedsCount",
    "hiring_needs_count",
  ]);
}

function getHiringIntakeHeadcount(item = {}) {
  return getNumberValue(item, [
    "hiringIntakeHeadcount",
    "hiring_intake_headcount",
    "intakeHeadcount",
    "intake_headcount",
    "prfHeadcount",
    "prf_headcount",
    "totalPersonnel",
    "total_personnel",
    "requestedPersonnel",
    "requested_personnel",
    "requestedHeadcount",
    "requested_headcount",
  ]);
}

function getInterviewCount(item = {}) {
  return getNumberValue(item, [
    "interviewCount",
    "interview_count",
    "interviewPopulationCount",
    "interview_population_count",
    "alreadyInterviewed",
    "already_interviewed",
  ]);
}

function getHiredCount(item = {}) {
  const directHired = getNumberValue(
    item,
    ["hiredCount", "hired_count", "hired"],
    0,
  );

  if (directHired > 0) return directHired;

  return getFstCount(item) + getPstCount(item);
}

function getStageAttritionMetrics(item = {}) {
  const interviewCount = getPositiveNumber(getInterviewCount(item));
  const nhoCount = getPositiveNumber(getNhoCount(item));
  const fstCount = getPositiveNumber(getFstCount(item));
  const pstCount = getPositiveNumber(getPstCount(item));

  /*
    Count display should never be negative.
    Percentage stays signed to show movement direction:
    - Positive = drop / attrition from previous stage.
    - Negative = next stage has more people than previous stage.
  */
  const signedInterviewToNhoCount = interviewCount - nhoCount;
  const signedNhoToFstCount = nhoCount - fstCount;
  const signedFstToPstCount = fstCount - pstCount;
  const signedNhoToPstCount = nhoCount - pstCount;

  return {
    interviewCount,
    nhoCount,
    fstCount,
    pstCount,
    interviewToNhoCount: Math.abs(signedInterviewToNhoCount),
    nhoToFstCount: Math.abs(signedNhoToFstCount),
    fstToPstCount: Math.abs(signedFstToPstCount),
    nhoToPstCount: Math.abs(signedNhoToPstCount),
    signedInterviewToNhoCount,
    signedNhoToFstCount,
    signedFstToPstCount,
    signedNhoToPstCount,
  };
}

function getAttritionRate(count, base) {
  const cleanCount = Math.abs(toNumber(count));
  const cleanBase = Math.abs(toNumber(base));

  if (cleanBase <= 0 || cleanCount <= 0) return 0;

  /*
    Count stays positive for readability, but attrition rate is displayed
    as negative because it represents a loss/gap from one stage to the next.
  */
  return -((cleanCount / cleanBase) * 100);
}

function getAttritionRateClass(rate) {
  const cleanRate = toNumber(rate);

  if (cleanRate < 0) return "text-red-600";

  return cleanRate <= 25 ? "text-emerald-600" : "text-red-600";
}

function getSignedPercentClass(value, positiveClass = "text-emerald-600") {
  const cleanValue = toNumber(value);

  if (cleanValue < 0) return "text-red-600";
  if (cleanValue > 0) return positiveClass;

  return "text-slate-700";
}

function getBufferGapPercentageFromTotals({
  requiredHeadcount = 0,
  actualHeadcount = 0,
  absenteeismTotal = 0,
  attritionTotal = 0,
}) {
  const required = toNumber(requiredHeadcount);

  if (required <= 0) return 0;

  const netActualHeadcount =
    toNumber(actualHeadcount) -
    toNumber(absenteeismTotal) -
    toNumber(attritionTotal);

  return ((netActualHeadcount - required) / required) * 100;
}

function getAttritionRateBadgeClass(rate) {
  const cleanRate = toNumber(rate);

  if (cleanRate < 0) {
    return "bg-red-50 text-red-600 border-red-100";
  }

  return cleanRate <= 25
    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
    : "bg-red-50 text-red-600 border-red-100";
}

function getCountAccentClass(colorClass = "") {
  if (colorClass.includes("violet")) {
    return "bg-violet-50 text-violet-700 border-violet-100";
  }

  if (colorClass.includes("emerald")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (colorClass.includes("red")) {
    return "bg-red-50 text-red-600 border-red-100";
  }

  return "bg-blue-50 text-blue-700 border-blue-100";
}

function TrainingAttritionCard({
  title,
  count,
  rate,
  countClassName = "text-blue-700",
}) {
  const positiveCount = getPositiveNumber(count);
  const signedRate = toNumber(rate);

  return (
    <div
      className={`${EDGE} ${CARD_BORDER} whp-kpi-card min-h-[124px] bg-white p-4 shadow-sm transition hover:-translate-y-[1px] hover:border-blue-200 hover:shadow-md`}
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-center gap-2">
          <p className="text-center text-[13px] font-extrabold text-slate-900">
            {title}
          </p>

          <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-[10px] font-extrabold text-blue-500">
            i
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 items-center gap-3">
          <div
            className={`rounded-[10px] border px-3 py-3 text-center ${getCountAccentClass(
              countClassName,
            )}`}
          >
            <p className={`whp-kpi-value text-3xl font-extrabold ${countClassName}`}>
              <AnimatedNumber value={positiveCount} />
            </p>

            <p className="mt-1 text-[11px] font-bold text-slate-600">
              Attrition Count
            </p>
          </div>

          <div
            className={`rounded-[10px] border px-3 py-3 text-center ${getAttritionRateBadgeClass(
              signedRate,
            )}`}
          >
            <p
              className={`whp-kpi-value text-3xl font-extrabold ${getAttritionRateClass(
                signedRate,
              )}`}
            >
              <AnimatedNumber value={signedRate} decimals={0} suffix="%" />
            </p>

            <p className="mt-1 text-[11px] font-bold text-slate-600">
              Attrition Rate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  subtitle,
  value,
  footer,
  icon: Icon,
  valueClassName = "text-sibs-primary-1",
  iconClassName = "bg-blue-50 text-blue-600",
}) {
  return (
    <div
      className={`${EDGE} ${CARD_BORDER} whp-kpi-card min-h-[112px] bg-white p-4 shadow-sm transition hover:-translate-y-[1px] hover:border-blue-200 hover:shadow-md`}
    >
      <div className="flex h-full items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconClassName}`}
        >
          <Icon size={24} />
        </div>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
            {title}
          </p>

          {subtitle && (
            <p className="mt-0.5 truncate text-[10px] font-bold text-slate-500">
              {subtitle}
            </p>
          )}

          <p
            className={`whp-kpi-value mt-2 truncate text-3xl font-extrabold ${valueClassName}`}
          >
            {value}
          </p>

          {footer && (
            <div className="mt-2 text-[11px] font-semibold text-slate-600">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HeadcountTable({ filteredPlans = [] }) {
  const totals = useMemo(() => {
    const rows = (filteredPlans || []).filter((item) => !item.isAssignedEmptyRow);

    const requiredHeadcount = rows.reduce(
      (sum, item) => sum + getRequiredHeadcount(item),
      0,
    );

    const actualHeadcount = rows.reduce(
      (sum, item) => sum + getActualHeadcount(item),
      0,
    );

    const absenteeismTotal = rows.reduce(
      (sum, item) => sum + getAbsenteeismTotal(item),
      0,
    );

    const attritionTotal = rows.reduce(
      (sum, item) => sum + getAttritionTotal(item),
      0,
    );

    const absenteeismBufferCount = absenteeismTotal;
    const attritionBufferCount = attritionTotal;
    const bufferCount = absenteeismBufferCount + attritionBufferCount;

    /*
      Count remains positive: Absenteeism + Attrition.
      Percentage is signed Excel-style to show if there is a gap.
      Negative = gap. Positive = surplus after Absenteeism and Attrition.
    */
    const bufferPercentage = getBufferGapPercentageFromTotals({
      requiredHeadcount,
      actualHeadcount,
      absenteeismTotal,
      attritionTotal,
    });

    const effectiveDemand = requiredHeadcount + bufferCount;

    const baseCoverage = rows.reduce(
      (sum, item) => sum + getCoverageValue(item),
      0,
    );

    const projectedFromTraining = rows.reduce(
      (sum, item) => sum + getProjectedFromTraining(item),
      0,
    );

    /*
      Still computed internally because Hiring Needed can use coverage logic.
      The old "Projected Coverage" card is now replaced with Hiring Intake count.
    */
    const projectedCoverage = actualHeadcount + projectedFromTraining;

    const computedHiringNeeded = Math.max(
      0,
      effectiveDemand - projectedCoverage,
    );

    const directHiringNeeded = rows.reduce(
      (sum, item) => sum + getHiringNeeded(item),
      0,
    );

    const hiringNeeded =
      directHiringNeeded > 0 ? directHiringNeeded : computedHiringNeeded;

    const totalInterviewed = rows.reduce(
      (sum, item) => sum + getInterviewCount(item),
      0,
    );

    const totalHired = rows.reduce(
      (sum, item) => sum + getHiredCount(item),
      0,
    );

    const directHiringRateAverage =
      rows.length > 0
        ? rows.reduce(
            (sum, item) =>
              sum +
              getNumberValue(
                item,
                [
                  "hiringRate",
                  "hiring_rate",
                  "hiringPlanPercent",
                  "hiring_plan_percent",
                ],
                0,
              ),
            0,
          ) / rows.length
        : 0;

    const hiringRate =
      totalInterviewed > 0
        ? (totalHired / totalInterviewed) * 100
        : directHiringRateAverage;

    const directLeadsToInterview = rows.reduce(
      (sum, item) => sum + getLeadsToInterview(item),
      0,
    );

    const hiringRateDecimal = hiringRate > 0 ? hiringRate / 100 : 0;

    const computedLeadsToInterview =
      hiringRateDecimal > 0 ? Math.ceil(hiringNeeded / hiringRateDecimal) : 0;

    const leadsToInterview =
      directLeadsToInterview > 0
        ? directLeadsToInterview
        : computedLeadsToInterview;

    const directHiringIntakeCount = rows.reduce(
      (sum, item) => sum + getHiringIntakeCount(item),
      0,
    );

    const distinctHiringIntakeIds = new Set();

    rows.forEach((item) => {
      const intakeId =
        item.hiringIntakeId ||
        item.hiring_intake_id ||
        item.prfId ||
        item.prf_id ||
        item.personnelRequisitionId ||
        item.personnel_requisition_id ||
        item.requisitionId ||
        item.requisition_id;

      if (intakeId !== undefined && intakeId !== null && intakeId !== "") {
        distinctHiringIntakeIds.add(String(intakeId));
      }
    });

    const hiringIntakeCount =
      directHiringIntakeCount > 0
        ? directHiringIntakeCount
        : distinctHiringIntakeIds.size;

    const hiringIntakeHeadcount = rows.reduce(
      (sum, item) => sum + getHiringIntakeHeadcount(item),
      0,
    );

    /*
      Updated logic:
      Coverage = Base Coverage + Hiring Intake Headcount
      Leads to Interview = Coverage / Hiring Rate
    */
    const coverage = baseCoverage + hiringIntakeHeadcount;

    const leadsToInterviewByCoverage =
      hiringRateDecimal > 0 ? Math.ceil(coverage / hiringRateDecimal) : coverage;

    const finalLeadsToInterview =
      directLeadsToInterview > 0
        ? directLeadsToInterview
        : leadsToInterviewByCoverage;

    const trainingAttrition = rows.reduce(
      (sum, item) => {
        const metrics = getStageAttritionMetrics(item);

        sum.interviewCount += metrics.interviewCount;
        sum.nhoCount += metrics.nhoCount;
        sum.fstCount += metrics.fstCount;
        sum.pstCount += metrics.pstCount;
        sum.interviewToNhoCount += metrics.interviewToNhoCount;
        sum.nhoToFstCount += metrics.nhoToFstCount;
        sum.fstToPstCount += metrics.fstToPstCount;
        sum.nhoToPstCount += metrics.nhoToPstCount;
        sum.signedInterviewToNhoCount += metrics.signedInterviewToNhoCount;
        sum.signedNhoToFstCount += metrics.signedNhoToFstCount;
        sum.signedFstToPstCount += metrics.signedFstToPstCount;
        sum.signedNhoToPstCount += metrics.signedNhoToPstCount;

        return sum;
      },
      {
        interviewCount: 0,
        nhoCount: 0,
        fstCount: 0,
        pstCount: 0,
        interviewToNhoCount: 0,
        nhoToFstCount: 0,
        fstToPstCount: 0,
        nhoToPstCount: 0,
        signedInterviewToNhoCount: 0,
        signedNhoToFstCount: 0,
        signedFstToPstCount: 0,
        signedNhoToPstCount: 0,
      },
    );

    trainingAttrition.interviewToNhoRate = getAttritionRate(
      trainingAttrition.signedInterviewToNhoCount,
      trainingAttrition.interviewCount,
    );
    trainingAttrition.nhoToFstRate = getAttritionRate(
      trainingAttrition.signedNhoToFstCount,
      trainingAttrition.nhoCount,
    );
    trainingAttrition.fstToPstRate = getAttritionRate(
      trainingAttrition.signedFstToPstCount,
      trainingAttrition.fstCount,
    );
    trainingAttrition.nhoToPstRate = getAttritionRate(
      trainingAttrition.signedNhoToPstCount,
      trainingAttrition.nhoCount,
    );

    return {
      records: rows.length,
      requiredHeadcount,
      actualHeadcount,
      absenteeismTotal,
      attritionTotal,
      absenteeismBufferCount,
      attritionBufferCount,
      bufferCount,
      bufferPercentage,
      effectiveDemand,
      baseCoverage,
      coverage,
      projectedCoverage,
      projectedFromTraining,
      hiringNeeded,
      totalInterviewed,
      hiringRate,
      leadsToInterview: finalLeadsToInterview,
      hiringIntakeCount,
      hiringIntakeHeadcount,
      trainingAttrition,
    };
  }, [filteredPlans]);

  return (
    <div className="bg-white p-4 sm:p-5">
      <style>
        {`
          @keyframes whpKpiFadeUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes whpKpiPulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.035);
            }
          }

          .whp-kpi-card {
            animation: whpKpiFadeUp 0.42s ease-out both;
          }

          .whp-kpi-card:hover .whp-kpi-value {
            animation: whpKpiPulse 0.45s ease-out both;
          }

          .whp-kpi-card:nth-child(1) { animation-delay: 0ms; }
          .whp-kpi-card:nth-child(2) { animation-delay: 45ms; }
          .whp-kpi-card:nth-child(3) { animation-delay: 90ms; }
          .whp-kpi-card:nth-child(4) { animation-delay: 135ms; }
          .whp-kpi-card:nth-child(5) { animation-delay: 180ms; }
          .whp-kpi-card:nth-child(6) { animation-delay: 225ms; }
          .whp-kpi-card:nth-child(7) { animation-delay: 270ms; }
          .whp-kpi-card:nth-child(8) { animation-delay: 315ms; }
        `}
      </style>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Required HC"
          subtitle="Client Plan"
          value={<AnimatedNumber value={totals.requiredHeadcount} />}
          footer={`Across ${formatNumber(totals.records)} Accounts`}
          icon={UsersRound}
          valueClassName="text-blue-700"
          iconClassName="bg-blue-50 text-blue-600"
        />

        <KpiCard
          title="Actual HC"
          subtitle="Endorsed"
          value={<AnimatedNumber value={totals.actualHeadcount} />}
          footer="Endorsed / On Floor"
          icon={UserRound}
          valueClassName="text-emerald-600"
          iconClassName="bg-emerald-50 text-emerald-600"
        />

        <KpiCard
          title="Hiring Intake"
          subtitle="PRF Count"
          value={<AnimatedNumber value={totals.hiringIntakeCount} />}
          footer={
            <span>
              Headcount:{" "}
              <b>
                <AnimatedNumber value={totals.hiringIntakeHeadcount} />
              </b>
            </span>
          }
          icon={UsersRound}
          valueClassName="text-cyan-700"
          iconClassName="bg-cyan-50 text-cyan-700"
        />

        <KpiCard
          title="Interview Count"
          subtitle="Interview Pipeline"
          value={<AnimatedNumber value={totals.totalInterviewed} />}
          footer="People Under Interview"
          icon={AlertTriangle}
          valueClassName="text-red-600"
          iconClassName="bg-red-50 text-red-600"
        />

        <KpiCard
          title="Buffer Count / Gap %"
          subtitle="Count + Signed Gap"
          value={
            <span className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
              <AnimatedNumber
                value={totals.bufferCount}
                className="text-violet-700"
              />
              <AnimatedNumber
                value={totals.bufferPercentage}
                decimals={2}
                suffix="%"
                className={`text-2xl ${getSignedPercentClass(
                  totals.bufferPercentage,
                  "text-emerald-600",
                )}`}
              />
            </span>
          }
          footer={
            <span>
              Abs:{" "}
              <b>
                <AnimatedNumber value={totals.absenteeismBufferCount} />
              </b>
              <span className="mx-2 text-slate-300">|</span>
              Attr:{" "}
              <b>
                <AnimatedNumber value={totals.attritionBufferCount} />
              </b>
            </span>
          }
          icon={ShieldCheck}
          valueClassName="text-violet-700"
          iconClassName="bg-violet-50 text-violet-700"
        />

        <KpiCard
          title="Coverage"
          subtitle="Coverage + Hiring Intake"
          value={<AnimatedNumber value={totals.coverage} />}
          footer={
            <span>
              Base:{" "}
              <b>
                <AnimatedNumber value={totals.baseCoverage} />
              </b>
              <span className="mx-2 text-slate-300">|</span>
              Intake:{" "}
              <b>
                <AnimatedNumber value={totals.hiringIntakeHeadcount} />
              </b>
            </span>
          }
          icon={Target}
          valueClassName="text-amber-600"
          iconClassName="bg-amber-50 text-amber-600"
        />

        <KpiCard
          title="Hiring Rate"
          subtitle="Conversion to Hire"
          value={
            <AnimatedNumber value={totals.hiringRate} decimals={0} suffix="%" />
          }
          footer="FST + PST / Interview"
          icon={TrendingUp}
          valueClassName="text-indigo-600"
          iconClassName="bg-indigo-50 text-indigo-600"
        />

        <KpiCard
          title="Leads to Interview"
          subtitle="Needed"
          value={<AnimatedNumber value={totals.leadsToInterview} />}
          footer="Coverage / Hiring Rate"
          icon={BarChart3}
          valueClassName="text-violet-700"
          iconClassName="bg-violet-50 text-violet-700"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TrainingAttritionCard
          title="Interview → NHO Attrition"
          count={totals.trainingAttrition.interviewToNhoCount}
          rate={totals.trainingAttrition.interviewToNhoRate}
          countClassName="text-blue-700"
        />

        <TrainingAttritionCard
          title="NHO → FST Attrition"
          count={totals.trainingAttrition.nhoToFstCount}
          rate={totals.trainingAttrition.nhoToFstRate}
          countClassName="text-violet-700"
        />

        <TrainingAttritionCard
          title="FST → PST Attrition"
          count={totals.trainingAttrition.fstToPstCount}
          rate={totals.trainingAttrition.fstToPstRate}
          countClassName="text-emerald-600"
        />

        <TrainingAttritionCard
          title="NHO → PST Attrition"
          count={totals.trainingAttrition.nhoToPstCount}
          rate={totals.trainingAttrition.nhoToPstRate}
          countClassName="text-red-600"
        />
      </div>
    </div>
  );
}