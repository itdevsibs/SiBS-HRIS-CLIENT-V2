import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createManualCandidateExperience,
  getCandidateExperienceList,
  getCandidatePipelineCandidatesForExperience,
} from "@/lib/axios/candidateExperience";
import {
  getCandidateExperienceRecords,
  saveCandidateExperienceRecord,
} from "@/lib/utils/candidateExperienceStore";
import {
  RESPONSE_SOURCE,
  normalizeCandidateExperienceRecord,
} from "@/lib/utils/candidateExperience/index.js";

function rowsFromResponse(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.candidateExperience)) return response.candidateExperience;
  return [];
}

function pipelineRowsFromResponse(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.candidates)) return response.candidates;
  return [];
}

export function useCandidateExperience() {
  const [records, setRecords] = useState([]);
  const [candidateOptions, setCandidateOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [candidateLoading, setCandidateLoading] = useState(true);
  const [error, setError] = useState("");
  const [dataMode, setDataMode] = useState("api");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getCandidateExperienceList();
      if (response?.success !== false) {
        const apiRows = rowsFromResponse(response).map(normalizeCandidateExperienceRecord);
        setRecords(apiRows);
        setDataMode("api");
        return { success: true, data: apiRows, source: "api" };
      }

      const localRows = getCandidateExperienceRecords();
      setRecords(localRows);
      setDataMode("local-fallback");
      if (!localRows.length && response?.status && response.status !== 404) {
        setError(response.message || "Failed to load candidate experience records.");
      }
      return { success: true, data: localRows, source: "local-fallback", warning: response?.message || "" };
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCandidates = useCallback(async () => {
    setCandidateLoading(true);
    try {
      const response = await getCandidatePipelineCandidatesForExperience();
      const rows = response?.success === false ? [] : pipelineRowsFromResponse(response);
      setCandidateOptions(rows);
      return rows;
    } finally {
      setCandidateLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    void refreshCandidates();
  }, [refresh, refreshCandidates]);

  useEffect(() => {
    function handleUpdate() {
      if (dataMode === "local-fallback") setRecords(getCandidateExperienceRecords());
    }
    window.addEventListener("candidate-experience-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("candidate-experience-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [dataMode]);

  const saveManual = useCallback(async (payload) => {
    const manualPayload = {
      ...payload,
      responseSource: "ta_manual",
      response_source: RESPONSE_SOURCE.TA_MANUAL,
    };
    const response = await createManualCandidateExperience(manualPayload);
    if (response?.success !== false) {
      const saved = normalizeCandidateExperienceRecord(response?.data || response?.record || manualPayload);
      setRecords((previous) => [saved, ...previous.filter((item) => String(item.id) !== String(saved.id))]);
      setDataMode("api");
      return { success: true, data: saved, persistence: "api" };
    }

    const saved = saveCandidateExperienceRecord({
      ...manualPayload,
      id: manualPayload.id || `EXP-MANUAL-${Date.now()}`,
    });
    setRecords((previous) => [saved, ...previous.filter((item) => String(item.id) !== String(saved.id))]);
    setDataMode("local-fallback");
    return {
      success: true,
      data: saved,
      persistence: "local-fallback",
      warning: "Saved in the current frontend Candidate Experience store because the backend Candidate Experience endpoint is not available yet.",
    };
  }, []);

  return useMemo(() => ({
    records,
    candidateOptions,
    loading,
    candidateLoading,
    error,
    dataMode,
    refresh,
    refreshCandidates,
    saveManual,
  }), [records, candidateOptions, loading, candidateLoading, error, dataMode, refresh, refreshCandidates, saveManual]);
}
