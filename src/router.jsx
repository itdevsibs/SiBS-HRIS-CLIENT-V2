import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import NotFound from "@/pages/NotFound";
import LoginPage from "./pages/login/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PageFallback from "@/components/ui/PageFallback";
import { useUser } from "./services/context/UserContext";
import { getDefaultDashboardPath } from "./config/accessControl";

function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem("sibs-page-has-been-force-refreshed") || "false"
    );

    try {
      const importedModule = await componentImport();
      window.sessionStorage.removeItem("sibs-page-has-been-force-refreshed");
      return importedModule;
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

// Dashboards
const AdminDashboardPage = lazyWithRetry(() => import("./pages/dashboard/HrAdmin/AdminDashboardPage"));
const EmployeeDashboardPage = lazyWithRetry(() => import("./pages/dashboard/EmployeeDashboardPage"));
const OMDashboardPage = lazyWithRetry(() => import("./pages/dashboard/OMDashboard/OMDashboardPage"));
const SuperAdminDashboardPage = lazyWithRetry(() => import("./pages/dashboard/SuperAdmin/SuperAdminDashboardPage"));
const TADashboardPage = lazyWithRetry(() => import("./pages/dashboard/TADashboard/TADashboardPage"));

// Employees
const EmployeeDataPage = lazyWithRetry(() => import("./pages/employee/EmployeeDataPage"));
const EmployeesPage = lazyWithRetry(() => import("./pages/employee/EmployeesPage"));
const ProfileUserPage = lazyWithRetry(() => import("./pages/profile/UserProfilePage"));

// Core HR & Operations
const AttendancePage = lazyWithRetry(() => import("./pages/attendance/AttendancePage"));
const LeavesPage = lazyWithRetry(() => import("./pages/leaves/LeavesPage"));
const ResignationManagementPage = lazyWithRetry(() => import("./pages/resignation-management/ResignationManagementPage"));
const RequisitionsPage = lazyWithRetry(() => import("./pages/requisitions/RequisitionPage"));
const SchedulePage = lazyWithRetry(() => import("./pages/schedule/SchedulePage"));
const KronosDatasPage = lazyWithRetry(() => import("./pages/kronos-datas/KronosDatasPage"));
const ApprovalRequest = lazyWithRetry(() => import("./pages/communication/ApprovalRequest"));

// Recruitment
const HiringNeedsPage = lazyWithRetry(() => import("./pages/recruitment/HiringNeedsPage"));
const JobDescriptionPage = lazyWithRetry(() => import("./pages/recruitment/JobDescriptionPage"));
const JobDescriptionViewPage = lazyWithRetry(() => import("./pages/recruitment/JobDescriptionViewPage"));
const WorkforceHiringPlanPage = lazyWithRetry(() => import("./pages/recruitment/WorkforceHiringPlanPage"));
const WorkforceHiringOverviewPage = lazyWithRetry(() => import("./pages/recruitment/WorkforceHiringOverviewPage"));
const TalentPoolPage = lazyWithRetry(() => import("./pages/recruitment/talent-pool/TalentPoolPage"));
const TalentPoolApplyPage = lazyWithRetry(() => import("./pages/recruitment/talent-pool/PublicTalentPoolApplicationPage"));
const CandidatePipelinePage = lazyWithRetry(() => import("./pages/recruitment/CandidatePipelinePage"));
const PublicInterviewDateSelectionPage = lazyWithRetry(() => import("./pages/recruitment/candidate-pipeline/PublicInterviewDateSelectionPage"));
const OffersPage = lazyWithRetry(() => import("./pages/recruitment/OffersPage"));
const PublicOfferResponsePage = lazyWithRetry(() => import("./pages/recruitment/PublicOfferResponsePage"));
const PublicNhoScheduleResponsePage = lazyWithRetry(() => import("./pages/recruitment/PublicNhoScheduleResponsePage"));
const OnboardingPage = lazyWithRetry(() => import("./pages/recruitment/OnboardingPage"));
const CandidateExperiencePage = lazyWithRetry(() => import("./pages/recruitment/candidateExperience/CandidateExperiencePage"));
const CandidateExperienceSurveyPage = lazyWithRetry(() => import("./pages/recruitment/candidateExperience/public/CandidateExperienceSurveyPage"));
const SourcingAnalyticsPage = lazyWithRetry(() => import("./pages/recruitment/SourcingAnalyticsPage"));
const ActionItemsPage = lazyWithRetry(() => import("./pages/recruitment/ActionItemsPage"));
const WeeklyReportsPage = lazyWithRetry(() => import("./pages/recruitment/WeeklyReportsPage"));
const AvailablePositionsPage = lazyWithRetry(() => import("./pages/recruitment/AvailablePositionsPage"));
const ApplicantLeadsPage = lazyWithRetry(() => import("./pages/recruitment/ApplicantLeadsPage"));
const PublicJobDescriptionPage = lazyWithRetry(() => import("./pages/recruitment/talent-pool/PublicJobDescriptionPage"));
const FinalInterviewForms = lazyWithRetry(() => import("./components/recruitment/forms/FinalInterviewForms"));

// Settings
const RecruitmentSettingsPage = lazyWithRetry(() => import("./pages/Settings/RecruitmentSettingsPage"));
const AccountSettingsPage = lazyWithRetry(() => import("./pages/Settings/AccountSettingsPage"));

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

function DashboardRedirect() {
  const { user } = useUser();
  const targetPath = getDefaultDashboardPath(user);
  return <Navigate to={targetPath} replace />;
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
      <Route
        path="/public/nho-schedule-response/:token"
        element={<PublicNhoScheduleResponsePage />}
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
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardRedirect />
          </PrivateRoute>
        }
      />

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
        path="/recruitment/applicant-leads"
        element={
          <PrivateRoute>
            <ApplicantLeadsPage />
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

  return (
    <Suspense fallback={<PageFallback />}>
      {isPublicApplicationHostname(hostname) ? (
        <PublicApplicationRoutes />
      ) : (
        <MainApplicationRoutes />
      )}
    </Suspense>
  );
}
