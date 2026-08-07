import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPublicCandidateExperienceSurvey,
  submitPublicCandidateExperienceSurvey,
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
        candidateName: "Sample Candidate",
        candidateEmail: "candidate.sample@example.com",
        roleTitle: "Customer Support Representative",
        account: "Healthcare Operations",
        outcome: "Completed",
        surveyStatus: "Sent",
        submitted: false,
        isDemoPreview: true,
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

    if (!token || survey?.isDemoPreview) {
      setSubmitting(true);
      setError("");
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSubmission({
        id: `CEX-PREVIEW-${Math.floor(1000 + Math.random() * 9000)}`,
        experienceRating: payload.experienceRating || 5,
        feedbackCategory: payload.feedbackCategory || "Recruitment Process",
        feedback: payload.feedback || "Sample candidate feedback submission.",
        submittedAt: new Date().toISOString(),
      });
      setSubmitted(true);
      setSubmitting(false);
      return { success: true };
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
  }, [token, submitting, survey?.isDemoPreview]);

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
