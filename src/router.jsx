import React from "react";
import { Route, Routes } from "react-router-dom";

import NotFound from "@/pages/NotFound";
import LoginPage from "./pages/login/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import AdminDashboardPage from "./pages/dashboard/AdminDashboardPage";
import EmployeeDashboardPage from "./pages/dashboard/EmployeeDashboardPage";
import OMDashboardPage from "./pages/dashboard/OMDashboardPage";

import EmployeeDataPage from "./pages/employee/EmployeeDataPage";
import EmployeesPage from "./pages/employee/EmployeesPage";

import AttendancePage from "./pages/attendance/AttendancePage";
import LeavesPage from "./pages/leaves/LeavesPage";
import AttritionPage from "./pages/attrition/AttritionPage";
import RequisitionsPage from "./pages/requisitions/RequisitionPage";
import ResignationPage from "./pages/resignation/ResignationPage";
import SchedulePage from "./pages/schedule/SchedulePage";
import UsersPage from "./pages/users/UserManagementPage";
import ProfileUserPage from "./pages/profile/UserProfilePage";

import TADashboardPage from "./pages/recruitment/TADashboardPage";
import HiringNeedsPage from "./pages/recruitment/HiringNeedsPage";
import JobDescriptionPage from "./pages/recruitment/JobDescriptionPage";
import WeeklyHiringPlanPage from "./pages/recruitment/WeeklyHiringPlanPage";
import TalentPoolPage from "./pages/recruitment/talent-pool/TalentPoolPage";
import TalentPoolApplyPage from "./pages/recruitment/talent-pool/PublicTalentPoolApplicationPage";
import CandidatePipelinePage from "./pages/recruitment/CandidatePipelinePage";
import OffersPage from "./pages/recruitment/OffersPage";
import OnboardingPage from "./pages/recruitment/OnboardingPage";
import CandidateExperiencePage from "./pages/recruitment/CandidateExperiencePage";
import SourcingAnalyticsPage from "./pages/recruitment/SourcingAnalyticsPage";
import ActionItemsPage from "./pages/recruitment/ActionItemPage";
import WeeklyReportsPage from "./pages/recruitment/WeeklyReportsPage";
import AvailablePositionsPage from "./pages/recruitment/AvailablePositionsPage";

import FinalInterviewForms from "./components/recruitment/forms/FinalInterviewForms";
import RecruitmentSettingsPage from "./pages/Settings/RecruitmentSettingsPage";

function PrivateRoute({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

const Router = () => {
  return (
    <Routes>
      {/* AUTH / PUBLIC */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* PUBLIC RECRUITMENT FORM */}
      <Route
        path="/recruitment/talent-pool/apply"
        element={<TalentPoolApplyPage />}
      />

      {/* DASHBOARDS */}
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
        path="/attrition"
        element={
          <PrivateRoute>
            <AttritionPage />
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
        path="/resignation"
        element={
          <PrivateRoute>
            <ResignationPage />
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
        path="/users"
        element={
          <PrivateRoute>
            <UsersPage />
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
        path="/recruitment/weekly-hiring-plan"
        element={
          <PrivateRoute>
            <WeeklyHiringPlanPage />
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

      {/* FALLBACK */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default Router;