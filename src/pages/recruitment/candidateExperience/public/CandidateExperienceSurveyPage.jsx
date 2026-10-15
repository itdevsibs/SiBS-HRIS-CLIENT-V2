import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, Send, Sparkles, UserRound } from "lucide-react";
import { useParams } from "react-router-dom";
import SurveyHeader from "@/components/recruitment/candidateExperience/survey/SurveyHeader.jsx";
import SurveyCandidateContext from "@/components/recruitment/candidateExperience/survey/SurveyCandidateContext.jsx";
import SurveyRating from "@/components/recruitment/candidateExperience/survey/SurveyRating.jsx";
import SurveyCategories from "@/components/recruitment/candidateExperience/survey/SurveyCategories.jsx";
import SurveyFeedback from "@/components/recruitment/candidateExperience/survey/SurveyFeedback.jsx";
import SurveySuccess from "@/components/recruitment/candidateExperience/survey/SurveySuccess.jsx";
import SurveyInvalidToken from "@/components/recruitment/candidateExperience/survey/SurveyInvalidToken.jsx";
import { usePublicCandidateSurvey } from "@/hooks/candidateExperience/usePublicCandidateSurvey.js";

function readQueryToken() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || params.get("surveyToken") || "";
}

export default function CandidateExperienceSurveyPage({ tokenParam = "" }) {
  const params = useParams();
  const token = useMemo(() => tokenParam || params?.token || readQueryToken(), [tokenParam, params?.token]);
  const { survey, loading, submitting, error, submitted, submission, reload, submit } = usePublicCandidateSurvey(token);

  const [rating, setRating] = useState(0);
  const [categories, setCategories] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [feedbackTag, setFeedbackTag] = useState("");
  const [formError, setFormError] = useState("");
  const [candidateDetails, setCandidateDetails] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });

  useEffect(() => {
    document.body.classList.add("public-candidate-experience-survey");
    return () => document.body.classList.remove("public-candidate-experience-survey");
  }, []);

  const completionPercentage = useMemo(() => {
    if (submitted) return 100;
    let filled = 0;
    if (rating > 0) filled += 50;
    if (Array.isArray(categories) ? categories.length > 0 : Boolean(categories)) filled += 50;
    return filled;
  }, [rating, categories, submitted]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!token) {
      if (!candidateDetails.firstName.trim()) return setFormError("First name is required.");
      if (!candidateDetails.lastName.trim()) return setFormError("Last name is required.");
      if (!candidateDetails.email.trim()) return setFormError("Email is required.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateDetails.email.trim())) {
        return setFormError("Enter a valid email address.");
      }
      if (!candidateDetails.phoneNumber.trim()) return setFormError("Phone number is required.");
    }

    if (!rating) return setFormError("Select an overall candidate experience rating from 1 to 5.");
    const selectedCategoryText = Array.isArray(categories) ? categories.join(", ") : String(categories || "").trim();
    if (!selectedCategoryText) return setFormError("Select at least one experience category.");

    const response = await submit({
      firstName: candidateDetails.firstName.trim(),
      middleName: candidateDetails.middleName.trim(),
      lastName: candidateDetails.lastName.trim(),
      email: candidateDetails.email.trim(),
      phoneNumber: candidateDetails.phoneNumber.trim(),
      experienceRating: rating,
      rating,
      feedbackCategory: selectedCategoryText,
      category: selectedCategoryText,
      feedback: feedback.trim(),
      qualitativeFeedback: feedback.trim(),
      feedbackTag: feedbackTag.trim(),
      responseSource: "candidate_survey",
    });

    if (response?.success === false) {
      setFormError(response.message || "Your feedback could not be submitted. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-sibs-canvas font-jakarta text-sibs-navy">
      <SurveyHeader completed={submitted} progressPercentage={completionPercentage} />

      <main className="mx-auto w-full max-w-[1060px] px-4 py-6 sm:px-6 sm:py-8">
        {/* HERO BANNER MATCHING TALENT POOL PUBLIC FORM EXACTLY */}
        <section className="relative mb-6 overflow-hidden h-auto rounded-[14px] border border-sibs-navy bg-gradient-to-r from-sibs-navy via-sibs-navy to-sibs-navy p-5 text-white shadow-lg sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sibs-orange/15 blur-3xl" />

          <div className="relative z-10 h-full">
            <div className="min-w-0 h-full text-left">
              <img
                alt="SiBS Logo"
                className="mx-auto mb-5 block h-16 w-auto select-none md:h-20"
                src="/SiBS_Logo%20w%20Tagline-white.png"
                style={{
                  animation:
                    "2.8s ease-in-out 0s infinite normal none running sibsLogoGlow",
                }}
              />

              <span className="inline-flex items-center gap-2 rounded-full border border-sibs-orange/40 bg-sibs-orange/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-sibs-orange">
                <Sparkles size={13} />
                No Login Required • Confidential Candidate Feedback
              </span>

              <h2 className="mt-3 text-xl font-extrabold tracking-tight sm:text-2xl">
                Voice of Candidate Experience Survey
              </h2>

              <p className="mt-2 max-w-3xl text-xs font-semibold leading-6 text-slate-200 sm:max-w-[720px] sm:text-sm">
                Share your candid feedback to help the SiBS HRIS Talent Acquisition team improve recruiter communication, interview transparency, and onboarding readiness.
              </p>
            </div>

            <div className="mt-4 w-full shrink-0 rounded-[10px] border border-white/10 bg-black/40 px-5 py-4 text-left backdrop-blur-sm sm:absolute sm:bottom-0 sm:right-0 sm:mt-0 sm:w-auto sm:min-w-[160px] sm:text-center">
              <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-300">
                Survey Completion
              </p>
              <p className="mt-1 text-2xl font-extrabold text-sibs-orange">
                {completionPercentage}%
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="rounded-[14px] border border-sibs-border bg-white p-12 text-center text-sm font-bold text-slate-400 shadow-sm">
            Validating your secure survey link...
          </section>
        ) : error && !survey ? (
          <SurveyInvalidToken message={error} onRetry={reload} />
        ) : submitted ? (
          <SurveySuccess
            survey={survey}
            submission={submission}
            rating={rating || survey?.experienceRating || survey?.rating || 0}
            category={Array.isArray(categories) && categories.length ? categories.join(", ") : survey?.feedbackCategory || survey?.category || "—"}
          />
        ) : survey ? (
          <div className="space-y-6">
            {token ? (
              <SurveyCandidateContext survey={survey} />
            ) : (
              <CandidateIdentityForm
                value={candidateDetails}
                onChange={setCandidateDetails}
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6 rounded-[14px] border border-sibs-border bg-white p-5 shadow-sm sm:p-6">
                <SurveyRating value={rating} onChange={setRating} />
                <SurveyCategories value={categories} onChange={setCategories} />
                <SurveyFeedback
                  feedback={feedback}
                  tag={feedbackTag}
                  onFeedbackChange={setFeedback}
                  onTagChange={setFeedbackTag}
                />

                {formError || error ? (
                  <div className="rounded-[10px] border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
                    {formError || error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-sibs-navy text-xs font-black text-white shadow-md transition hover:bg-sibs-orange active:scale-[0.99] disabled:opacity-60"
                >
                  <Send size={16} className="text-white" />
                  {submitting ? "Submitting Your Candidate Feedback..." : "Submit Candidate Experience Feedback"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <SurveyInvalidToken message="Survey data could not be loaded." onRetry={reload} />
        )}
      </main>

      <footer className="mx-auto max-w-[1060px] border-t border-slate-200 px-4 py-6 text-center text-[10px] font-semibold text-slate-400">
        © {new Date().getFullYear()} The Siblings Solutions • SiBS HRIS Talent Acquisition • All candidate responses are processed confidentially.
      </footer>
    </div>
  );
}


function CandidateIdentityForm({ value, onChange }) {
  const updateUppercase = (field, nextValue) => {
    onChange((current) => ({
      ...current,
      [field]: String(nextValue || "").toUpperCase(),
    }));
  };

  const updatePlain = (field, nextValue) => {
    onChange((current) => ({
      ...current,
      [field]: nextValue,
    }));
  };

  const updatePhone = (nextValue) => {
    const sanitized = String(nextValue || "").replace(/[^0-9+()\-\s]/g, "").slice(0, 25);
    updatePlain("phoneNumber", sanitized);
  };

  return (
    <section className="rounded-[14px] border border-sibs-border bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-sibs-navy text-white">
          <UserRound size={18} />
        </span>
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Candidate Information</p>
          <h3 className="text-sm font-black text-sibs-navy">Tell us who you are</h3>
          <p className="mt-0.5 text-[10px] font-medium text-slate-500">Please complete your details before submitting the survey.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SurveyInput
          label="First Name"
          required
          value={value.firstName}
          onChange={(event) => updateUppercase("firstName", event.target.value)}
          placeholder="FIRST NAME"
          autoComplete="given-name"
        />
        <SurveyInput
          label="Middle Name"
          value={value.middleName}
          onChange={(event) => updateUppercase("middleName", event.target.value)}
          placeholder="MIDDLE NAME"
          autoComplete="additional-name"
        />
        <SurveyInput
          label="Last Name"
          required
          value={value.lastName}
          onChange={(event) => updateUppercase("lastName", event.target.value)}
          placeholder="LAST NAME"
          autoComplete="family-name"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <SurveyInput
          icon={Mail}
          label="Email"
          required
          type="email"
          value={value.email}
          onChange={(event) => updatePlain("email", event.target.value)}
          placeholder="name@example.com"
          autoComplete="email"
        />
        <SurveyInput
          icon={Phone}
          label="Phone Number"
          required
          type="tel"
          value={value.phoneNumber}
          onChange={(event) => updatePhone(event.target.value)}
          placeholder="09XX XXX XXXX"
          autoComplete="tel"
          inputMode="tel"
        />
      </div>
    </section>
  );
}

function SurveyInput({ icon: Icon, label, required = false, ...inputProps }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-sibs-navy">
        {Icon ? <Icon size={12} className="text-slate-400" /> : null}
        {label}
        {required ? <span className="text-sibs-orange">*</span> : null}
      </span>
      <input
        {...inputProps}
        className="h-11 w-full rounded-[10px] border border-sibs-border bg-sibs-surface px-3.5 text-xs font-bold text-sibs-navy outline-none transition placeholder:font-semibold placeholder:text-sibs-faint focus:border-sibs-orange focus:bg-white focus:ring-2 focus:ring-sibs-orange/10"
      />
    </label>
  );
}
