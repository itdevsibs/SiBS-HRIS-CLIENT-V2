import { BrowserRouter, Routes, Route } from "react-router-dom";
import Providers from "@/services/providers";
import ConditionalSidebar from "@/components/layout/ConditionalSidebar";
import AdminLoginModal from "@/components/modals/AdminLoginModal";

import HomePage from "@/pages/index";
import NotFound from "@/pages/NotFound";

import LoginPage from "@/pages/login";
import AdminDashboardPage from "@/pages/dashboard/admin";
import EmployeeDashboardPage from "@/pages/dashboard/employee";
import EmployeePage from "@/pages/employee";
import EmployeeDataPage from "@/pages/employee/employee-data";
import AttendancePage from "@/pages/attendance";
import AttritionPage from "@/pages/attrition";
import RequisitionsPage from "@/pages/requisitions";
import ResignationPage from "@/pages/resignation";
import SchedulePage from "@/pages/schedule";
import UsersPage from "@/pages/users";
import ProfileUserPage from "@/pages/profile/user";

import TADashboardPage from "@/pages/recruitment/ta-dashboard";
import HiringNeedsPage from "@/pages/recruitment/hiring-needs";
import JobDescriptionPage from "@/pages/recruitment/job-description";
import WeeklyHiringPlanPage from "@/pages/recruitment/weekly-hiring-plan";
import TalentPoolPage from "@/pages/recruitment/talent-pool";
import TalentPoolApplyPage from "@/pages/recruitment/talent-pool/apply";
import CandidatePipelinePage from "@/pages/recruitment/candidate-pipeline";
import OffersPage from "@/pages/recruitment/offers";
import OnboardingPage from "@/pages/recruitment/onboarding";
import CandidateExperiencePage from "@/pages/recruitment/candidate-experience";
import SourcingAnalyticsPage from "@/pages/recruitment/sourcing-analytics";
import ActionItemsPage from "@/pages/recruitment/action-items";
import WeeklyReportsPage from "@/pages/recruitment/weekly-reports";

function AppShell({ children }) {
  return (
    <Providers>
      <div className="min-h-screen flex bg-[var(--sibs-tertiary-10)]">
        <ConditionalSidebar />
        <main className="flex-1">{children}</main>
      </div>
      <AdminLoginModal />
    </Providers>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/dashboard/admin" element={<AdminDashboardPage />} />
          <Route path="/dashboard/employee" element={<EmployeeDashboardPage />} />
          <Route path="/employee" element={<EmployeePage />} />
          <Route path="/employee/employee-data" element={<EmployeeDataPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/attrition" element={<AttritionPage />} />
          <Route path="/requisitions" element={<RequisitionsPage />} />
          <Route path="/resignation" element={<ResignationPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/profile/user" element={<ProfileUserPage />} />

          <Route path="/recruitment/ta-dashboard" element={<TADashboardPage />} />
          <Route path="/recruitment/hiring-needs" element={<HiringNeedsPage />} />
          <Route path="/recruitment/job-description" element={<JobDescriptionPage />} />
          <Route path="/recruitment/weekly-hiring-plan" element={<WeeklyHiringPlanPage />} />
          <Route path="/recruitment/talent-pool" element={<TalentPoolPage />} />
          <Route path="/recruitment/talent-pool/apply" element={<TalentPoolApplyPage />} />
          <Route path="/recruitment/candidate-pipeline" element={<CandidatePipelinePage />} />
          <Route path="/recruitment/offers" element={<OffersPage />} />
          <Route path="/recruitment/onboarding" element={<OnboardingPage />} />
          <Route path="/recruitment/candidate-experience" element={<CandidateExperiencePage />} />
          <Route path="/recruitment/sourcing-analytics" element={<SourcingAnalyticsPage />} />
          <Route path="/recruitment/action-items" element={<ActionItemsPage />} />
          <Route path="/recruitment/weekly-reports" element={<WeeklyReportsPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
