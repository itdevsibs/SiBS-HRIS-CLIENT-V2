import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import App from "./App.jsx";
import PublicInterviewDateSelectionPage from "./pages/recruitment/candidate-pipeline/PublicInterviewDateSelectionPage.jsx";
import "./index.css";

function isPublicInterviewPath(pathname = "") {
  return (
    pathname === "/public/interview-date" ||
    pathname.startsWith("/public/interview-date/")
  );
}

export function PublicInterviewApp() {
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
    </Routes>
  );
}

const isPublicInterviewRoute = isPublicInterviewPath(
  window.location.pathname,
);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {isPublicInterviewRoute ? <PublicInterviewApp /> : <App />}
    </BrowserRouter>
  </React.StrictMode>,
);
