import React from "react";

import Header from "../../components/layout/Header";
import ApplicantLeadModal from "../../components/recruitment/applicantLeads/ApplicantLeadModal";
import ApplicantLeadsDirectory from "../../components/recruitment/applicantLeads/ApplicantLeadsDirectory";
import ApplicantLeadsHeader from "../../components/recruitment/applicantLeads/ApplicantLeadsHeader";
import ApplicantLeadsSummary from "../../components/recruitment/applicantLeads/ApplicantLeadsSummary";
import ApplicantLeadsToast from "../../components/recruitment/applicantLeads/ApplicantLeadsToast";
import { ApplicantLeadsProvider } from "../../services/context/ApplicantLeadsContext";

function ApplicantLeadsPageContent() {
  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
          <ApplicantLeadsToast />
          <ApplicantLeadsHeader />
          <ApplicantLeadsSummary />
          <ApplicantLeadsDirectory />
        </div>
      </main>

      <ApplicantLeadModal />
    </div>
  );
}

export default function ApplicantLeadsPage() {
  return (
    <ApplicantLeadsProvider>
      <ApplicantLeadsPageContent />
    </ApplicantLeadsProvider>
  );
}
