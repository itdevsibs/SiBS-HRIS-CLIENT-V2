import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import App from "./App.jsx";
import PublicInterviewDateSelectionPage from "./pages/recruitment/candidate-pipeline/PublicInterviewDateSelectionPage.jsx";
import PublicOfferResponsePage from "./pages/recruitment/PublicOfferResponsePage.jsx";
import "./index.css";

function isStandalonePublicPath(pathname = "") {
  return (
    pathname === "/public/interview-date" ||
    pathname.startsWith("/public/interview-date/") ||
    pathname === "/public/offer-response" ||
    pathname.startsWith("/public/offer-response/")
  );
}

export function StandalonePublicApp() {
  return (
    <Routes>
      <Route
        path="/public/interview-date/:token"
        element={<PublicInterviewDateSelectionPage />}
      />

      <Route
        path="/public/interview-date"
        element={<PublicInterviewDateSelectionPage />}
      />

      <Route
        path="/public/offer-response/:token"
        element={<PublicOfferResponsePage />}
      />
    </Routes>
  );
}

const isStandalonePublicRoute = isStandalonePublicPath(
  window.location.pathname,
);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {isStandalonePublicRoute ? <StandalonePublicApp /> : <App />}
    </BrowserRouter>
  </React.StrictMode>,
);
