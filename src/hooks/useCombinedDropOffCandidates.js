import { useCallback, useEffect, useState } from "react";

import api from "../lib/axios/api-template";
import { getTalentPoolApplications } from "../lib/axios/getTalentPool";
import {
  isDropOffCandidate,
  mergeDropOffCandidates,
} from "../lib/utils/recruitment/dropOffCandidates";

function getPipelineRows(payload = {}) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.candidates)) return payload.candidates;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

async function getCandidatePipelineDropOffRecords() {
  const response = await api.get("/api/candidate-pipeline", {
    params: {
      limit: 500,
      _t: Date.now(),
    },
    withCredentials: true,
  });

  const payload = response?.data || {};

  if (payload?.success === false) {
    throw new Error(payload?.message || "Failed to load Candidate Pipeline.");
  }

  return getPipelineRows(payload).filter(isDropOffCandidate);
}

async function getTalentPoolDropOffRecords() {
  const response = await getTalentPoolApplications({
    page: 1,
    limit: 500,
    status: "Drop Off",
  });

  if (!response?.success) {
    throw new Error(
      response?.message || "Failed to load Talent Pool drop-off records.",
    );
  }

  const records = Array.isArray(response?.data) ? response.data : [];

  return records.filter(isDropOffCandidate);
}

export default function useCombinedDropOffCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    const [pipelineResult, talentPoolResult] = await Promise.allSettled([
      getCandidatePipelineDropOffRecords(),
      getTalentPoolDropOffRecords(),
    ]);

    const pipelineCandidates =
      pipelineResult.status === "fulfilled" ? pipelineResult.value : [];

    const talentPoolCandidates =
      talentPoolResult.status === "fulfilled" ? talentPoolResult.value : [];

    setCandidates(
      mergeDropOffCandidates(pipelineCandidates, talentPoolCandidates),
    );

    const errors = [];

    if (pipelineResult.status === "rejected") {
      errors.push(
        pipelineResult.reason?.response?.data?.message ||
          pipelineResult.reason?.message ||
          "Failed to load Candidate Pipeline drop-off records.",
      );
    }

    if (talentPoolResult.status === "rejected") {
      errors.push(
        talentPoolResult.reason?.response?.data?.message ||
          talentPoolResult.reason?.message ||
          "Failed to load Talent Pool drop-off records.",
      );
    }

    setLoadError(errors.join(" "));
    setIsLoading(false);

    return {
      success: errors.length === 0,
      data: mergeDropOffCandidates(
        pipelineCandidates,
        talentPoolCandidates,
      ),
      message: errors.join(" "),
    };
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    let timeoutId = null;

    function scheduleRefresh() {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        refresh();
      }, 100);
    }

    window.addEventListener("ta-talent-pool-updated", scheduleRefresh);
    window.addEventListener("ta-pipeline-candidates-updated", scheduleRefresh);
    window.addEventListener("focus", scheduleRefresh);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("ta-talent-pool-updated", scheduleRefresh);
      window.removeEventListener(
        "ta-pipeline-candidates-updated",
        scheduleRefresh,
      );
      window.removeEventListener("focus", scheduleRefresh);
    };
  }, [refresh]);

  return {
    candidates,
    isLoading,
    loadError,
    refresh,
  };
}
