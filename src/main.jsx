import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import App from "./App.jsx";
import PublicRouteFallback from "./components/ui/PublicRouteFallback.jsx";
import { isStandalonePublicRoute } from "./config/publicRoutes";
import "./index.css";

function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem("sibs-page-has-been-force-refreshed") || "false"
    );

    try {
      return await componentImport();
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem("sibs-page-has-been-force-refreshed", "true");
        window.location.reload();
        return { default: () => null };
      }
      throw error;
    }
  });
}

const PublicInterviewDateSelectionPage = lazyWithRetry(() =>
  import("./pages/recruitment/candidate-pipeline/PublicInterviewDateSelectionPage.jsx")
);
const PublicOfferResponsePage = lazyWithRetry(() =>
  import("./pages/recruitment/PublicOfferResponsePage.jsx")
);
const PublicNhoScheduleResponsePage = lazyWithRetry(() =>
  import("./pages/recruitment/PublicNhoScheduleResponsePage.jsx")
);
const PublicTalentPoolApplicationPage = lazyWithRetry(() =>
  import("./pages/recruitment/talent-pool/PublicTalentPoolApplicationPage.jsx")
);
const PublicJobDescriptionPage = lazyWithRetry(() =>
  import("./pages/recruitment/talent-pool/PublicJobDescriptionPage.jsx")
);
const CandidateExperienceSurveyPage = lazyWithRetry(() =>
  import("./pages/recruitment/candidateExperience/public/CandidateExperienceSurveyPage.jsx")
);
const FinalInterviewForms = lazyWithRetry(() =>
  import("./components/recruitment/forms/FinalInterviewForms.jsx")
);

/* =====================================================
   STANDALONE PUBLIC APPLICATION

   IMPORTANT:
   This component does NOT render <App />.

   Therefore it does NOT mount:
   - UserProvider
   - authenticated HRIS providers
   - sidebar
   - private route validation
   - auth refresh timers
   - HRIS logout lifecycle
===================================================== */

export function StandalonePublicApp() {
  return (
    <Suspense fallback={<PublicRouteFallback />}>
      <Routes>
        {/* =========================================
            TALENT POOL APPLICATION

            Production:
            https://sibsapply.getleadsource.com/

            Local:
            http://localhost:5173/apply
        ========================================= */}

        <Route
          path="/"
          element={<PublicTalentPoolApplicationPage />}
        />

        <Route
          path="/apply"
          element={<PublicTalentPoolApplicationPage />}
        />

        <Route
          path="/public/talent-pool/apply"
          element={<PublicTalentPoolApplicationPage />}
        />

        <Route
          path="/recruitment/talent-pool/apply"
          element={<PublicTalentPoolApplicationPage />}
        />

        {/* =========================================
            PUBLIC JOB DESCRIPTION

            Production:
            https://sibsapply.getleadsource.com/job-description/12

            Local:
            http://localhost:5173/job-description/12
        ========================================= */}

        <Route
          path="/job-description/:id"
          element={<PublicJobDescriptionPage />}
        />

        <Route
          path="/job-description"
          element={<PublicJobDescriptionPage />}
        />

        <Route
          path="/public/job-description/:id"
          element={<PublicJobDescriptionPage />}
        />

        <Route
          path="/public/job-description"
          element={<PublicJobDescriptionPage />}
        />

        {/* =========================================
            PUBLIC INTERVIEW DATE
        ========================================= */}

        <Route
          path="/public/interview-date/:token"
          element={<PublicInterviewDateSelectionPage />}
        />

        <Route
          path="/public/interview-date"
          element={<PublicInterviewDateSelectionPage />}
        />

        {/* =========================================
            PUBLIC OFFER RESPONSE
        ========================================= */}

        <Route
          path="/public/offer-response/:token"
          element={<PublicOfferResponsePage />}
        />

        <Route
          path="/public/offer-response"
          element={<PublicOfferResponsePage />}
        />

        {/* =========================================
            PUBLIC NHO SCHEDULE RESPONSE
        ========================================= */}

        <Route
          path="/public/nho-schedule-response/:token"
          element={<PublicNhoScheduleResponsePage />}
        />

        <Route
          path="/public/nho-schedule-response"
          element={<PublicNhoScheduleResponsePage />}
        />

        {/* =========================================
            PUBLIC CANDIDATE EXPERIENCE SURVEY
        ========================================= */}

        <Route
          path="/public/candidate-experience-survey/:token"
          element={<CandidateExperienceSurveyPage />}
        />

        <Route
          path="/public/candidate-experience-survey"
          element={<CandidateExperienceSurveyPage />}
        />

        <Route
          path="/recruitment/candidate-experience/survey"
          element={<CandidateExperienceSurveyPage />}
        />

        {/* =========================================
            ONLINE ASSESSMENT / EVALUATION FORM
        ========================================= */}

        <Route
          path="/online-assessment"
          element={<FinalInterviewForms publicMode />}
        />

        {/* =========================================
            PUBLIC HOST FALLBACK
        ========================================= */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Suspense>
  );
}

/* =====================================================
   BOOTSTRAP
===================================================== */

const pathname = window.location.pathname;
const hostname = window.location.hostname;

const isStandalonePublic = isStandalonePublicRoute(
  pathname,
  hostname,
);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {isStandalonePublic ? <StandalonePublicApp /> : <App />}
    </BrowserRouter>
  </React.StrictMode>,
);
