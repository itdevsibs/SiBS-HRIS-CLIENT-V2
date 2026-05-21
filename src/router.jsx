import React from "react";
import { Route, Routes } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import LoginPage from "./pages/login/LoginPage";
import AdminDashboardPage from "./pages/dashboard/AdminDashboardPage";
import EmployeeDashboardPage from "./pages/dashboard/EmployeeDashboardPage";
import EmployeeDataPage from "./pages/employee/EmployeeDataPage";
import EmployeesPage from "./pages/employee/EmployeesPage";
import AttendancePage from "./pages/attendance/AttendancePage";
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

import OMDashboardPage from "./pages/dashboard/OMDashboardPage";
import FinalInterviewForms from "./components/recruitment/forms/FinalInterviewForms";
import RecruitmentSettingsPage from "./pages/Settings/RecruitmentSettingsPage";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard/admin" element={<AdminDashboardPage />} />
      <Route path="/dashboard/employee" element={<EmployeeDashboardPage />} />
      <Route path="/employee" element={<EmployeesPage />} />
      <Route path="/employee/employee-data" element={<EmployeeDataPage />} />
      <Route path="/attendance" element={<AttendancePage />} />
      <Route path="/attrition" element={<AttritionPage />} />
      <Route path="/requisitions" element={<RequisitionsPage />} />
      <Route path="/resignation" element={<ResignationPage />} />
      <Route path="/schedule" element={<SchedulePage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/profile/user" element={<ProfileUserPage />} />

      <Route path="/recruitment/ta-dashboard" element={<TADashboardPage />} />
      <Route path="/recruitment/om-dashboard" element={<OMDashboardPage />} />
      <Route path="/recruitment/hiring-needs" element={<HiringNeedsPage />} />
      <Route
        path="/recruitment/job-description"
        element={<JobDescriptionPage />}
      />
      <Route
        path="/recruitment/weekly-hiring-plan"
        element={<WeeklyHiringPlanPage />}
      />
      <Route path="/recruitment/talent-pool" element={<TalentPoolPage />} />
      <Route
        path="/recruitment/talent-pool/apply"
        element={<TalentPoolApplyPage />}
      />
      <Route
        path="/recruitment/candidate-pipeline"
        element={<CandidatePipelinePage />}
      />
      <Route path="/recruitment/offers" element={<OffersPage />} />
      <Route path="/recruitment/onboarding" element={<OnboardingPage />} />
      <Route
        path="/recruitment/candidate-experience"
        element={<CandidateExperiencePage />}
      />
      <Route
        path="/recruitment/sourcing-analytics"
        element={<SourcingAnalyticsPage />}
      />
      <Route path="/recruitment/action-items" element={<ActionItemsPage />} />
      <Route
        path="/recruitment/weekly-reports"
        element={<WeeklyReportsPage />}
      />
      <Route
        path="/recruitment/available-positions"
        element={<AvailablePositionsPage />}
      />

      <Route
        path="/recruitment/final-interview-form"
        element={<FinalInterviewForms />}
      />

      <Route
        path="/settings/recruitment-settings"
        element={<RecruitmentSettingsPage />}
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default Router;
