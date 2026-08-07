import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import NotFound from "@/pages/NotFound";
import LoginPage from "./pages/login/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import AdminDashboardPage from "./pages/dashboard/HrAdmin/AdminDashboardPage";
import EmployeeDashboardPage from "./pages/dashboard/EmployeeDashboardPage";
import OMDashboardPage from "./pages/dashboard/OMDashboard/OMDashboardPage";
import SuperAdminDashboardPage from "./pages/dashboard/SuperAdmin/SuperAdminDashboardPage";

import EmployeeDataPage from "./pages/employee/EmployeeDataPage";
import EmployeesPage from "./pages/employee/EmployeesPage";

import AttendancePage from "./pages/attendance/AttendancePage";
import KronosAttendancePage from "./pages/kronos-attendance/KronosAttendancePage";
import LeavesPage from "./pages/leaves/LeavesPage";
import ResignationManagementPage from "./pages/resignation-management/ResignationManagementPage";
import RequisitionsPage from "./pages/requisitions/RequisitionPage";
import SchedulePage from "./pages/schedule/SchedulePage";
import ProfileUserPage from "./pages/profile/UserProfilePage";

import TADashboardPage from "./pages/dashboard/TADashboard/TADashboardPage";
import HiringNeedsPage from "./pages/recruitment/HiringNeedsPage";
import JobDescriptionPage from "./pages/recruitment/JobDescriptionPage";
import JobDescriptionViewPage from "./pages/recruitment/JobDescriptionViewPage";
import WorkforceHiringPlanPage from "./pages/recruitment/WorkforceHiringPlanPage";
import TalentPoolPage from "./pages/recruitment/talent-pool/TalentPoolPage";
import TalentPoolApplyPage from "./pages/recruitment/talent-pool/PublicTalentPoolApplicationPage";
import CandidatePipelinePage from "./pages/recruitment/CandidatePipelinePage";
import PublicInterviewDateSelectionPage from "./pages/recruitment/candidate-pipeline/PublicInterviewDateSelectionPage";
import OffersPage from "./pages/recruitment/OffersPage";
import PublicOfferResponsePage from "./pages/recruitment/PublicOfferResponsePage";
import OnboardingPage from "./pages/recruitment/OnboardingPage";
import CandidateExperiencePage from "./pages/recruitment/candidateExperience/CandidateExperiencePage";
import CandidateExperienceSurveyPage from "./pages/recruitment/candidateExperience/public/CandidateExperienceSurveyPage";
import SourcingAnalyticsPage from "./pages/recruitment/SourcingAnalyticsPage";
import ActionItemsPage from "./pages/recruitment/ActionItemsPage";
import WeeklyReportsPage from "./pages/recruitment/WeeklyReportsPage";
import AvailablePositionsPage from "./pages/recruitment/AvailablePositionsPage";

import FinalInterviewForms from "./components/recruitment/forms/FinalInterviewForms";
import RecruitmentSettingsPage from "./pages/Settings/RecruitmentSettingsPage";
import AccountSettingsPage from "./pages/Settings/AccountSettingsPage";

import ApprovalRequest from "./pages/communication/ApprovalRequest";
import KronosDatasPage from "./pages/kronos-datas/KronosDatasPage";
import WorkforceHiringOverviewPage from "./pages/recruitment/WorkforceHiringOverviewPage";
import PublicJobDescriptionPage from "./pages/recruitment/talent-pool/PublicJobDescriptionPage";

const DEFAULT_PUBLIC_APPLICATION_HOST = "sibsapply.getleadsource.com";

function normalizeHostname(value) {
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

export function isPublicApplicationHostname(hostname) {
  const normalizedHostname = normalizeHostname(hostname);

  if (!normalizedHostname) {
    return false;
  }

  return getPublicApplicationHosts().includes(normalizedHostname);
}

function PrivateRoute({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function PublicApplicationRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TalentPoolApplyPage />} />

      {/* Public job-description pages opened from the application form. */}
      <Route
        path="/job-description/:id"
        element={<PublicJobDescriptionPage />}
      />
      <Route
        path="/public/job-description/:id"
        element={<PublicJobDescriptionPage />}
      />

      {/* A JD URL without an ID returns to the public application form. */}
      <Route path="/job-description" element={<Navigate to="/" replace />} />
      <Route
        path="/public/job-description"
        element={<Navigate to="/" replace />}
      />

      {/* Keep old public application links working. */}
      <Route path="/apply" element={<Navigate to="/" replace />} />
      <Route
        path="/recruitment/talent-pool/apply"
        element={<Navigate to="/" replace />}
      />
      <Route
        path="/public/talent-pool/apply"
        element={<Navigate to="/" replace />}
      />

      {/* Do not expose private HRIS routes through the public hostname. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function MainApplicationRoutes() {
  return (
    <Routes>
      {/* AUTH / PUBLIC */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* PUBLIC EMPLOYMENT OFFER RESPONSE */}
      <Route
        path="/public/offer-response/:token"
        element={<PublicOfferResponsePage />}
      />

      {/* PUBLIC ONLINE ASSESSMENT / JOB EVALUATION FORM */}
      <Route
        path="/online-assessment"
        element={<FinalInterviewForms publicMode />}
      />

      {/* PUBLIC CANDIDATE INTERVIEW SCHEDULING */}
      <Route
        path="/public/interview-date/:token"
        element={<PublicInterviewDateSelectionPage />}
      />

      {/* PUBLIC CANDIDATE EXPERIENCE SURVEY */}
      <Route
        path="/public/candidate-experience-survey"
        element={<CandidateExperienceSurveyPage />}
      />
      <Route
        path="/public/candidate-experience-survey/:token"
        element={<CandidateExperienceSurveyPage />}
      />
      <Route
        path="/recruitment/candidate-experience/survey"
        element={<CandidateExperienceSurveyPage />}
      />

      {/* PUBLIC TALENT POOL APPLICATION FORM */}
      <Route path="/apply" element={<TalentPoolApplyPage />} />

      <Route
        path="/recruitment/talent-pool/apply"
        element={<TalentPoolApplyPage />}
      />

      <Route
        path="/public/talent-pool/apply"
        element={<TalentPoolApplyPage />}
      />

      {/* PUBLIC JOB DESCRIPTION - localhost and main HRIS hostname */}
      <Route
        path="/job-description/:id"
        element={<PublicJobDescriptionPage />}
      />
      <Route
        path="/public/job-description/:id"
        element={<PublicJobDescriptionPage />}
      />
      <Route
        path="/job-description"
        element={<Navigate to="/apply" replace />}
      />
      <Route
        path="/public/job-description"
        element={<Navigate to="/apply" replace />}
      />

      {/* ROUTE ALIASES */}
      <Route
        path="/candidate-pipeline"
        element={<Navigate to="/recruitment/candidate-pipeline" replace />}
      />

      <Route
        path="/talent-pool"
        element={<Navigate to="/recruitment/talent-pool" replace />}
      />

      <Route
        path="/offers"
        element={<Navigate to="/recruitment/offers" replace />}
      />

      <Route
        path="/approval-requests"
        element={<Navigate to="/approval-request" replace />}
      />

      {/* DASHBOARDS */}
      <Route
        path="/dashboard/super-admin"
        element={
          <PrivateRoute>
            <SuperAdminDashboardPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/dashboard/admin"
        element={
          <PrivateRoute>
            <AdminDashboardPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/dashboard/employee"
        element={
          <PrivateRoute>
            <EmployeeDashboardPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/recruitment/om-dashboard"
        element={
          <PrivateRoute>
            <OMDashboardPage />
          </PrivateRoute>
        }
      />

      {/* EMPLOYEE */}
      <Route
        path="/employee"
        element={
          <PrivateRoute>
            <EmployeesPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/employee/employee-data"
        element={
          <PrivateRoute>
            <EmployeeDataPage />
          </PrivateRoute>
        }
      />

      {/* HR MODULES */}
      <Route
        path="/attendance"
        element={
          <PrivateRoute>
            <AttendancePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/kronos-attendance"
        element={
          <PrivateRoute>
            <KronosAttendancePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/leaves"
        element={
          <PrivateRoute>
            <LeavesPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/resignation"
        element={
          <PrivateRoute>
            <ResignationManagementPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/requisitions"
        element={
          <PrivateRoute>
            <RequisitionsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/schedule"
        element={
          <PrivateRoute>
            <SchedulePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/profile/user"
        element={
          <PrivateRoute>
            <ProfileUserPage />
          </PrivateRoute>
        }
      />

      {/* RECRUITMENT */}
      <Route
        path="/recruitment/ta-dashboard"
        element={
          <PrivateRoute>
            <TADashboardPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/recruitment/hiring-needs"
        element={
          <PrivateRoute>
            <HiringNeedsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/recruitment/job-description"
        element={
          <PrivateRoute>
            <JobDescriptionPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/recruitment/job-description/view/:id"
        element={
          <PrivateRoute>
            <JobDescriptionViewPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/recruitment/workforce-hiring-overview"
        element={
          <PrivateRoute>
            <WorkforceHiringOverviewPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/recruitment/workforce-hiring-plan"
        element={
          <PrivateRoute>
            <WorkforceHiringPlanPage />
            {/* <NotFound /> */}
          </PrivateRoute>
        }
      />

      <Route
        path="/recruitment/talent-pool"
        element={
          <PrivateRoute>
            <TalentPoolPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/recruitment/candidate-pipeline"
        element={
          <PrivateRoute>
            <CandidatePipelinePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/recruitment/offers"
        element={
          <PrivateRoute>
            <OffersPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/recruitment/onboarding"
        element={
          <PrivateRoute>
            <OnboardingPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/recruitment/candidate-experience"
        element={
          <PrivateRoute>
            <CandidateExperiencePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/recruitment/sourcing-analytics"
        element={
          <PrivateRoute>
            <SourcingAnalyticsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/recruitment/action-items"
        element={
          <PrivateRoute>
            <ActionItemsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/recruitment/weekly-reports"
        element={
          <PrivateRoute>
            <WeeklyReportsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/recruitment/available-positions"
        element={
          <PrivateRoute>
            <AvailablePositionsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/recruitment/final-interview-form"
        element={
          <PrivateRoute>
            <FinalInterviewForms />
          </PrivateRoute>
        }
      />

      {/* SETTINGS */}
      <Route
        path="/settings/recruitment-settings"
        element={
          <PrivateRoute>
            <RecruitmentSettingsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/settings/account-settings"
        element={
          <PrivateRoute>
            <AccountSettingsPage />
          </PrivateRoute>
        }
      />

      {/* COMMUNICATION */}
      <Route
        path="/approval-request"
        element={
          <PrivateRoute>
            <ApprovalRequest />
          </PrivateRoute>
        }
      />

      {/* KRONOS */}
      <Route
        path="/kronos-datas"
        element={
          <PrivateRoute>
            <KronosDatasPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/approval-request/job-description/view/:id"
        element={
          <PrivateRoute>
            <JobDescriptionViewPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/approval-requests/job-description/view/:id"
        element={
          <PrivateRoute>
            <JobDescriptionViewPage />
          </PrivateRoute>
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function Router() {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  if (isPublicApplicationHostname(hostname)) {
    return <PublicApplicationRoutes />;
  }

  return <MainApplicationRoutes />;
}
