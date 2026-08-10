import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPublicCandidateExperienceSurvey,
  submitPublicCandidateExperienceSurvey,
  submitOpenPublicCandidateExperienceSurvey,
} from "@/lib/axios/candidateExperience";

export function usePublicCandidateSurvey(token) {
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submission, setSubmission] = useState(null);

  const load = useCallback(async () => {
    if (!token) {
      setSurvey({
        publicOpenSurvey: true,
        submitted: false,
      });
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const response = await getPublicCandidateExperienceSurvey(token);
    if (response?.success === false) {
      setSurvey(null);
      setError(response.message || "This survey link is invalid, expired, or unavailable.");
    } else {
      setSurvey(response?.data || response?.survey || response);
      setSubmitted(Boolean(response?.data?.submitted || response?.submitted));
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(async (payload) => {
    if (submitting) return { success: false, message: "Survey is submitting..." };

    if (!token) {
      setSubmitting(true);
      setError("");
      try {
        const response = await submitOpenPublicCandidateExperienceSurvey(payload);
        if (response?.success === false) {
          setError(response.message || "Your feedback could not be submitted.");
          return response;
        }
        setSubmission(response?.data || response?.submission || response);
        setSubmitted(true);
        return { success: true, data: response?.data || response?.submission || response };
      } finally {
        setSubmitting(false);
      }
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await submitPublicCandidateExperienceSurvey(token, payload);
      if (response?.success === false) {
        setError(response.message || "Your feedback could not be submitted.");
        return response;
      }
      setSubmission(response?.data || response?.record || response);
      setSubmitted(true);
      return { success: true, data: response?.data || response?.record || response };
    } finally {
      setSubmitting(false);
    }
  }, [token, submitting]);

  return useMemo(() => ({
    survey,
    loading,
    submitting,
    error,
    submitted,
    submission,
    reload: load,
    submit,
  }), [survey, loading, submitting, error, submitted, submission, load, submit]);
}
