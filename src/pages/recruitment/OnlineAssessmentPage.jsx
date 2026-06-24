import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Send,
} from "lucide-react";

import api from "../../lib/axios/api-template";

function cleanText(value) {
  return String(value ?? "").trim();
}

function getApiErrorMessage(error, fallback = "Request failed.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export default function OnlineAssessmentPage() {
  const queryParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );

  const candidateId = cleanText(queryParams.get("candidateId"));
  const email = cleanText(queryParams.get("email"));

  const [candidate, setCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAssessmentCandidate() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        if (!candidateId || !email) {
          throw new Error("Assessment link is missing candidate information.");
        }

        const response = await api.get(
          `/api/candidate-pipeline/public-assessment/${encodeURIComponent(
            candidateId,
          )}`,
          {
            params: {
              email,
            },
            withCredentials: false,
          },
        );

        const payload = response?.data || {};

        if (payload?.success === false) {
          throw new Error(payload?.message || "Invalid assessment link.");
        }

        if (!cancelled) {
          setCandidate(payload?.candidate || payload?.data || null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Assessment link is invalid or expired.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadAssessmentCandidate();

    return () => {
      cancelled = true;
    };
  }, [candidateId, email]);

  async function handleSubmitAssessment(event) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await api.post(
        `/api/candidate-pipeline/public-assessment/${encodeURIComponent(
          candidateId,
        )}`,
        {
          email,
          assessmentStatus: "Taken",
          assessmentResult: "Submitted",
          assessmentRemarks:
            cleanText(remarks) || "Candidate submitted online assessment.",
        },
        {
          withCredentials: false,
        },
      );

      const payload = response?.data || {};

      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to submit assessment.");
      }

      setIsSubmitted(true);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Failed to submit online assessment."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="fixed inset-0 z-[99999] min-h-screen overflow-y-auto bg-[#F5F8FB] px-4 py-8 font-['Plus_Jakarta_Sans'] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <section className="overflow-hidden rounded-3xl border border-[#D9E2EC] bg-white shadow-sm">
          <div className="bg-sibs-primary-1 px-6 py-7 text-white sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <ClipboardCheck size={25} />
              </div>

              <div>
                <h1 className="text-2xl font-extrabold">
                  SiBS HRIS Online Assessment
                </h1>
                <p className="mt-1 text-sm font-semibold text-white/80">
                  Complete your online assessment submission.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {isLoading ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                <Loader2
                  size={34}
                  className="animate-spin text-sibs-primary-1"
                />
                <p className="mt-4 text-sm font-bold text-sibs-primary-1">
                  Loading assessment link...
                </p>
              </div>
            ) : errorMessage ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertCircle size={30} />
                </div>

                <h2 className="mt-4 text-xl font-extrabold text-red-700">
                  Assessment Link Error
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-red-600">
                  {errorMessage}
                </p>
              </div>
            ) : isSubmitted ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={30} />
                </div>

                <h2 className="mt-4 text-xl font-extrabold text-emerald-700">
                  Assessment Submitted
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-emerald-700">
                  Thank you. Your online assessment submission has been
                  received.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitAssessment} className="space-y-6">
                <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    Candidate
                  </p>

                  <h2 className="mt-2 text-xl font-extrabold text-[#101828]">
                    {candidate?.name || candidate?.candidateName || "Candidate"}
                  </h2>

                  <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                    {candidate?.email || email}
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-white p-4">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                        Candidate ID
                      </p>
                      <p className="mt-1 break-words text-sm font-extrabold text-[#101828]">
                        {candidate?.candidateId || candidateId}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-4">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                        Assessment Status
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-[#101828]">
                        {candidate?.assessmentStatus || "Not Take"}
                      </p>
                    </div>
                  </div>
                </div>

                <label className="block">
                  <span className="text-sm font-extrabold text-sibs-primary-1">
                    Assessment Notes / Confirmation
                  </span>

                  <textarea
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    rows={6}
                    placeholder="Type your confirmation or assessment notes here..."
                    className="mt-2 w-full resize-none rounded-2xl border border-[#D6DEE8] bg-white px-4 py-3 text-sm font-semibold text-[#344054] outline-none transition placeholder:text-slate-400 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {isSubmitting ? "Submitting..." : "Submit Assessment"}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}