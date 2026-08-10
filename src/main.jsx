import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import App from "./App.jsx";

import PublicInterviewDateSelectionPage from "./pages/recruitment/candidate-pipeline/PublicInterviewDateSelectionPage.jsx";
import PublicOfferResponsePage from "./pages/recruitment/PublicOfferResponsePage.jsx";
import PublicNhoScheduleResponsePage from "./pages/recruitment/PublicNhoScheduleResponsePage.jsx";

import PublicTalentPoolApplicationPage from "./pages/recruitment/talent-pool/PublicTalentPoolApplicationPage.jsx";
import PublicJobDescriptionPage from "./pages/recruitment/talent-pool/PublicJobDescriptionPage.jsx";
import CandidateExperienceSurveyPage from "./pages/recruitment/candidateExperience/public/CandidateExperienceSurveyPage.jsx";

import "./index.css";

/* =====================================================
   PUBLIC APPLICATION HOST
===================================================== */

const DEFAULT_PUBLIC_APPLICATION_HOST = "sibsapply.getleadsource.com";

function normalizeHostname(value = "") {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

function getPublicApplicationHosts() {
  const configuredHosts =
    import.meta.env.VITE_PUBLIC_APPLICATION_HOSTS ||
    import.meta.env.VITE_PUBLIC_APPLICATION_HOST ||
    DEFAULT_PUBLIC_APPLICATION_HOST;

  return String(configuredHosts)
    .split(",")
    .map(normalizeHostname)
    .filter(Boolean);
}

function isPublicApplicationHostname(hostname = "") {
  const normalizedHostname = normalizeHostname(hostname);

  if (!normalizedHostname) {
    return false;
  }

  return getPublicApplicationHosts().includes(normalizedHostname);
}

/* =====================================================
   STANDALONE PUBLIC PATH DETECTION
===================================================== */

function isStandalonePublicPath(pathname = "", hostname = "") {
  /*
   * Everything served from:
   *
   * https://sibsapply.getleadsource.com
   *
   * is part of the standalone public application.
   *
   * This prevents the normal HRIS App/UserProvider
   * from mounting on this hostname.
   */
  if (isPublicApplicationHostname(hostname)) {
    return true;
  }

  /*
   * Localhost / normal HRIS domain public routes.
   */
  return (
    /* ================= TALENT POOL ================= */
    pathname === "/apply" ||
    pathname === "/public/talent-pool/apply" ||
    pathname === "/recruitment/talent-pool/apply" ||

    /* ================= PUBLIC JD ================= */
    pathname === "/job-description" ||
    pathname.startsWith("/job-description/") ||
    pathname === "/public/job-description" ||
    pathname.startsWith("/public/job-description/") ||

    /* ================= INTERVIEW ================= */
    pathname === "/public/interview-date" ||
    pathname.startsWith("/public/interview-date/") ||

    /* ================= OFFER ================= */
    pathname === "/public/offer-response" ||
    pathname.startsWith("/public/offer-response/") ||

    /* ================= NHO ================= */
    pathname === "/public/nho-schedule-response" ||
    pathname.startsWith("/public/nho-schedule-response/") ||

    /* ================= CANDIDATE EXPERIENCE ================= */
    pathname === "/public/candidate-experience-survey" ||
    pathname.startsWith("/public/candidate-experience-survey/") ||
    pathname === "/recruitment/candidate-experience/survey" ||
    pathname.startsWith("/recruitment/candidate-experience/survey/")
  );
}

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
            PUBLIC HOST FALLBACK
        ========================================= */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
    </Routes>
  );
}

/* =====================================================
   BOOTSTRAP
===================================================== */

const pathname = window.location.pathname;
const hostname = window.location.hostname;

const isStandalonePublicRoute = isStandalonePublicPath(
  pathname,
  hostname,
);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {isStandalonePublicRoute ? <StandalonePublicApp /> : <App />}
    </BrowserRouter>
  </React.StrictMode>,
);
