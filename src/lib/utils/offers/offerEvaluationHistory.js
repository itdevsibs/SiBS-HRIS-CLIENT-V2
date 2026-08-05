function cleanText(value) {
  return String(value ?? "").trim();
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function safeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string" && cleanText(value)) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  return [];
}

function firstDefined(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== "",
  );
}

function toFiniteNumber(value) {
  if (value === undefined || value === null || value === "") return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatNumber(value) {
  const numberValue = toFiniteNumber(value);

  if (numberValue === null) return "";

  return numberValue.toLocaleString("en-PH", {
    maximumFractionDigits: 2,
  });
}

export function formatOfferScore(score, maximum = 100) {
  const scoreNumber = toFiniteNumber(score);

  if (scoreNumber === null) return "—";

  const maximumNumber = toFiniteNumber(maximum);

  return maximumNumber === null
    ? formatNumber(scoreNumber)
    : `${formatNumber(scoreNumber)} / ${formatNumber(maximumNumber)}`;
}

function getSubmittedForms(offer = {}) {
  return safeArray(
    offer.finalInterviewSubmittedForms ||
      offer.final_interview_submitted_forms ||
      offer.finalInterviewSubmissions ||
      offer.final_interview_submissions ||
      offer.submittedFinalInterviewForms ||
      offer.submitted_final_interview_forms,
  );
}

function getLatestSubmittedForm(offer = {}) {
  return [...getSubmittedForms(offer)].sort((a, b) => {
    const aTime = new Date(
      a.submittedAtIso ||
        a.submitted_at_iso ||
        a.submittedAt ||
        a.submitted_at ||
        a.createdAt ||
        a.created_at ||
        0,
    ).getTime();

    const bTime = new Date(
      b.submittedAtIso ||
        b.submitted_at_iso ||
        b.submittedAt ||
        b.submitted_at ||
        b.createdAt ||
        b.created_at ||
        0,
    ).getTime();

    return (
      (Number.isFinite(bTime) ? bTime : 0) -
      (Number.isFinite(aTime) ? aTime : 0)
    );
  })[0] || null;
}

function getLatestScoreSummary(offer = {}) {
  const latestSubmission = getLatestSubmittedForm(offer) || {};

  return safeObject(
    latestSubmission.scoreSummary ||
      latestSubmission.score_summary ||
      offer.finalInterviewScoreSummary ||
      offer.final_interview_score_summary,
  );
}

function getJobEvaluationSummary(offer = {}) {
  const scoreSummary = getLatestScoreSummary(offer);

  return safeObject(
    scoreSummary.jobEvaluation ||
      scoreSummary.job_evaluation ||
      scoreSummary.jobEvaluationScore ||
      scoreSummary.job_evaluation_score,
  );
}

function getFinalInterviewSummary(offer = {}) {
  const scoreSummary = getLatestScoreSummary(offer);

  return safeObject(
    scoreSummary.finalInterview ||
      scoreSummary.final_interview ||
      scoreSummary.finalInterviewSummary ||
      scoreSummary.final_interview_summary ||
      scoreSummary.finalInterviewScoreSummary ||
      scoreSummary.final_interview_score_summary,
  );
}

export function getOfferEvaluationScores(offer = {}) {
  const assessmentScore = firstDefined(
    offer.assessmentScore,
    offer.assessment_score,
    offer.assessmentScorePercent,
    offer.assessment_score_percent,
  );

  const assessmentMaximum = firstDefined(
    offer.assessmentMaxScore,
    offer.assessment_max_score,
    100,
  );

  const jobEvaluation = getJobEvaluationSummary(offer);
  const jobEvaluationScore = firstDefined(
    jobEvaluation.totalScore,
    jobEvaluation.total_score,
    jobEvaluation.percentageScore,
    jobEvaluation.percentage_score,
    jobEvaluation.score,
    offer.jobEvaluationScore,
    offer.job_evaluation_score,
  );

  const jobEvaluationMaximum = firstDefined(
    jobEvaluation.maxScore,
    jobEvaluation.max_score,
    jobEvaluation.maximumScore,
    jobEvaluation.maximum_score,
    offer.jobEvaluationMaxScore,
    offer.job_evaluation_max_score,
    100,
  );

  const finalInterview = getFinalInterviewSummary(offer);
  const finalInterviewScore = firstDefined(
    offer.finalInterviewScore,
    offer.final_interview_score,
    finalInterview.finalInterviewScore,
    finalInterview.final_interview_score,
    finalInterview.totalScore,
    finalInterview.total_score,
    finalInterview.score,
  );

  const finalInterviewMaximum = firstDefined(
    offer.finalInterviewMaxScore,
    offer.final_interview_max_score,
    finalInterview.finalInterviewMaxScore,
    finalInterview.final_interview_max_score,
    finalInterview.maxScore,
    finalInterview.max_score,
    100,
  );

  return {
    assessment: {
      score: toFiniteNumber(assessmentScore),
      maximum: toFiniteNumber(assessmentMaximum),
      display: formatOfferScore(assessmentScore, assessmentMaximum),
      result: cleanText(
        offer.assessmentResult || offer.assessment_result,
      ),
    },
    jobEvaluation: {
      score: toFiniteNumber(jobEvaluationScore),
      maximum: toFiniteNumber(jobEvaluationMaximum),
      display: formatOfferScore(
        jobEvaluationScore,
        jobEvaluationMaximum,
      ),
      rank: cleanText(
        firstDefined(
          jobEvaluation.rank,
          jobEvaluation.jobEvaluationRank,
          jobEvaluation.job_evaluation_rank,
          offer.jobEvaluationRank,
          offer.job_evaluation_rank,
        ),
      ).replace(/^rank\s+/i, ""),
    },
    finalInterview: {
      score: toFiniteNumber(finalInterviewScore),
      maximum: toFiniteNumber(finalInterviewMaximum),
      display: formatOfferScore(
        finalInterviewScore,
        finalInterviewMaximum,
      ),
      passingScore: toFiniteNumber(
        firstDefined(
          offer.finalInterviewPassingScore,
          offer.final_interview_passing_score,
          finalInterview.passingScore,
          finalInterview.passing_score,
        ),
      ),
      result: cleanText(
        firstDefined(
          offer.finalInterviewResult,
          offer.final_interview_result,
          finalInterview.finalInterviewResult,
          finalInterview.final_interview_result,
          finalInterview.result,
        ),
      ),
    },
  };
}

function normalizeOfferVersion(version = {}, offer = {}) {
  const metadata = safeObject(
    version.metadata || version.metadata_json || version.metadataJson,
  );

  const versionNumber = Number(
    firstDefined(
      version.versionNumber,
      version.version_number,
      version.offerVersion,
      version.offer_version,
      1,
    ),
  );

  const basicDailyRate = toFiniteNumber(
    firstDefined(
      version.basicDailyRate,
      version.basic_daily_rate,
      version.basicPay,
      version.basic_pay,
    ),
  );

  const dailyDeMinimis = toFiniteNumber(
    firstDefined(
      version.dailyDeMinimis,
      version.daily_de_minimis,
      version.deminimisDailyRate,
      version.deminimis_daily_rate,
    ),
  );

  return {
    ...version,
    id: version.id || "",
    candidatePipelineId: firstDefined(
      version.candidatePipelineId,
      version.candidate_pipeline_id,
      offer.candidatePipelineId,
      offer.candidate_pipeline_id,
      offer.dbId,
      offer.id,
    ),
    versionNumber: Number.isFinite(versionNumber) ? versionNumber : 1,
    parentVersionNumber: toFiniteNumber(
      firstDefined(
        version.parentVersionNumber,
        version.parent_version_number,
      ),
    ),
    roleTitle: cleanText(
      firstDefined(
        version.roleTitle,
        version.role_title,
        offer.roleTitle,
        offer.offerDetails?.roleTitle,
      ),
    ),
    account: cleanText(
      firstDefined(
        version.account,
        offer.account,
        offer.offerDetails?.account,
      ),
    ),
    basicDailyRate,
    dailyDeMinimis,
    totalDailyRate: toFiniteNumber(
      firstDefined(
        version.totalDailyRate,
        version.total_daily_rate,
        basicDailyRate !== null && dailyDeMinimis !== null
          ? basicDailyRate + dailyDeMinimis
          : null,
      ),
    ),
    candidateMessage: cleanText(
      firstDefined(
        version.candidateMessage,
        version.candidate_message,
        version.negotiationMessage,
        version.negotiation_message,
      ),
    ),
    internalRemarks: cleanText(
      firstDefined(
        version.internalRemarks,
        version.internal_remarks,
        version.remarks,
      ),
    ),
    approvalStatus: cleanText(
      firstDefined(
        version.approvalStatus,
        version.approval_status,
        "For Review",
      ),
    ),
    candidateResponse: cleanText(
      firstDefined(
        version.candidateResponse,
        version.candidate_response,
        "Pending",
      ),
    ),
    submittedBy: cleanText(
      firstDefined(version.submittedBy, version.submitted_by),
    ),
    submittedAt: firstDefined(
      version.submittedAt,
      version.submitted_at,
      version.createdAt,
      version.created_at,
      "",
    ),
    approvedBy: cleanText(
      firstDefined(version.approvedBy, version.approved_by),
    ),
    approvedAt: firstDefined(
      version.approvedAt,
      version.approved_at,
      "",
    ),
    rejectedBy: cleanText(
      firstDefined(version.rejectedBy, version.rejected_by),
    ),
    rejectedAt: firstDefined(
      version.rejectedAt,
      version.rejected_at,
      "",
    ),
    approvalRemarks: cleanText(
      firstDefined(
        version.approvalRemarks,
        version.approval_remarks,
      ),
    ),
    offerEmailSent: Boolean(
      firstDefined(
        version.offerEmailSent,
        version.offer_email_sent,
        false,
      ),
    ),
    offerSentAt: firstDefined(
      version.offerSentAt,
      version.offer_sent_at,
      "",
    ),
    metadata,
    previousBasicDailyRate: toFiniteNumber(
      firstDefined(
        version.previousBasicDailyRate,
        version.previous_basic_daily_rate,
        metadata.previousBasicDailyRate,
        metadata.previous_basic_daily_rate,
        metadata.previousBasicPay,
      ),
    ),
    previousDailyDeMinimis: toFiniteNumber(
      firstDefined(
        version.previousDailyDeMinimis,
        version.previous_daily_de_minimis,
        metadata.previousDailyDeMinimis,
        metadata.previous_daily_de_minimis,
        metadata.previousDeminimisDailyRate,
      ),
    ),
  };
}

function buildOriginalOfferVersion(offer = {}) {
  const offerDetails = safeObject(offer.offerDetails || offer.offer_details);

  return normalizeOfferVersion(
    {
      versionNumber: firstDefined(
        offer.offerVersion,
        offer.offer_version,
        1,
      ),
      roleTitle: firstDefined(
        offer.roleTitle,
        offerDetails.roleTitle,
        offerDetails.finalRole,
      ),
      account: firstDefined(
        offer.account,
        offerDetails.account,
        offerDetails.finalAccount,
      ),
      basicDailyRate: firstDefined(
        offer.basicPay,
        offer.basic_daily_rate,
        offerDetails.basicPay,
      ),
      dailyDeMinimis: firstDefined(
        offer.deminimisDailyRate,
        offer.daily_de_minimis,
        offerDetails.deminimisDailyRate,
      ),
      candidateMessage: firstDefined(
        offer.offerNegotiationMessage,
        offer.offer_negotiation_message,
      ),
      internalRemarks: firstDefined(
        offer.remarks,
        offerDetails.remarks,
      ),
      approvalStatus: firstDefined(
        offer.offerApprovalStatus,
        offer.offer_approval_status,
        offer.approvalStatus,
        "For Review",
      ),
      candidateResponse: firstDefined(
        offer.offerResponseStatus,
        offer.offer_response_status,
        offer.offerDecision,
        offer.offer_decision,
        offer.candidateResponse,
        "Pending",
      ),
      submittedBy: firstDefined(
        offer.createdBySibsId,
        offer.created_by_sibs_id,
        offer.owner,
      ),
      submittedAt: firstDefined(
        offer.offerCreatedAt,
        offerDetails.createdAt,
        offer.createdAt,
        offer.created_at,
        offer.updatedAt,
        offer.updated_at,
      ),
      offerEmailSent: firstDefined(
        offer.offerEmailSent,
        offer.offer_email_sent,
        offer.contractSent,
        false,
      ),
      offerSentAt: firstDefined(
        offer.offerEmailSentAt,
        offer.offer_email_sent_at,
        offer.contractSentAt,
      ),
    },
    offer,
  );
}

export function getOfferHistory(offer = {}) {
  const rawVersions = safeArray(
    offer.offerVersions ||
      offer.offer_versions ||
      offer.negotiationHistory ||
      offer.negotiation_history,
  );

  const versions = rawVersions.length
    ? rawVersions.map((version) => normalizeOfferVersion(version, offer))
    : [buildOriginalOfferVersion(offer)];

  return versions
    .filter((version) => Number.isFinite(version.versionNumber))
    .sort((a, b) => {
      if (b.versionNumber !== a.versionNumber) {
        return b.versionNumber - a.versionNumber;
      }

      const bTime = new Date(b.submittedAt || 0).getTime();
      const aTime = new Date(a.submittedAt || 0).getTime();

      return (
        (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0)
      );
    });
}

export function getLatestNegotiationSummary(offer = {}) {
  const history = getOfferHistory(offer);
  const latest = history[0] || buildOriginalOfferVersion(offer);
  const remark =
    cleanText(latest.candidateMessage) ||
    cleanText(latest.internalRemarks) ||
    cleanText(
      offer.offerNegotiationMessage || offer.offer_negotiation_message,
    );

  const hasNegotiation = Boolean(
    history.length > 1 ||
      remark ||
      ["negotiate", "negotiation", "for review"].includes(
        cleanText(latest.candidateResponse).toLowerCase(),
      ),
  );

  return {
    versionNumber: latest.versionNumber || 1,
    status:
      cleanText(latest.approvalStatus) ||
      cleanText(latest.candidateResponse) ||
      "Original Offer",
    remark,
    hasNegotiation,
    latest,
  };
}

export function formatOfferVersionDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return cleanText(value) || "—";

  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
