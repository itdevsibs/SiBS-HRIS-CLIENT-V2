import React, { useMemo, useState } from "react";
import { NHOProvider, useNHO } from "./NHOContext";
import NHORoleHeader from "./NHORoleHeader";
import NHOTADashboard from "./ta/NHOTADashboard";
import NHOAttendanceView from "./ta/NHOAttendanceView";
import NHOAttendanceModal from "./ta/NHOAttendanceModal";
import NHOApplicantDetails from "./ta/NHOApplicantDetails";
import NHODocumentVerificationModal from "./ta/NHODocumentVerificationModal";
import NHODocumentVerificationQueue from "./ta/NHODocumentVerificationQueue";
import NHOHandoffsView from "./ta/NHOHandoffsView";
import NHOApplicantPortal from "./applicant/NHOApplicantPortal";
import NHOITDashboard from "./it/NHOITDashboard";
import NHOWFMDashboard from "./wfm/NHOWFMDashboard";
import NHOHRDashboard from "./hr/NHOHRDashboard";
import NHOITEndorsementModal from "./ta/NHOITEndorsementModal";
function NHOInnerModule({ onSwitchModule }) {
  const { role, setRole, applicants, activeApplicant, setSelectedApplicantId } = useNHO();
  const [taSubTab, setTaSubTab] = useState("dashboard");
  const [applicantSubTab, setApplicantSubTab] = useState("overview");
  const [itSubTab, setItSubTab] = useState("queue");
  const [wfmSubTab, setWfmSubTab] = useState("queue");
  const [hrSubTab, setHrSubTab] = useState("handoffs");
  const [isApplicantProfileOpen, setIsApplicantProfileOpen] = useState(false);
  const [applicantProfileTab, setApplicantProfileTab] = useState("overview");
  const [isEndorsementModalOpen, setIsEndorsementModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [targetAttendanceApplicantId, setTargetAttendanceApplicantId] = useState(activeApplicant.id);
  const targetAttendanceApplicant = applicants.find((a) => a.id === targetAttendanceApplicantId) || activeApplicant;
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDocForVerification, setSelectedDocForVerification] = useState(null);
  React.useEffect(() => {
    if (role === "QDS" || role === "Trainer") {
      setRole("HR");
    }
  }, [role, setRole]);
  const getCurrentSubTab = () => {
    if (role === "TA") return taSubTab;
    if (role === "Applicant") return applicantSubTab;
    if (role === "IT") return itSubTab;
    if (role === "WFM") return wfmSubTab;
    return hrSubTab;
  };
  const handleSubTabChange = (newSubTab) => {
    if (role === "TA") setTaSubTab(newSubTab);
    else if (role === "Applicant") setApplicantSubTab(newSubTab);
    else if (role === "IT") setItSubTab(newSubTab);
    else if (role === "WFM") setWfmSubTab(newSubTab);
    else setHrSubTab(newSubTab);
  };
  const handleOpenAttendanceModal = (app) => {
    setTargetAttendanceApplicantId(app.id);
    setSelectedApplicantId(app.id);
    setIsAttendanceModalOpen(true);
  };
  const handleOpenApplicantDetails = (app, defaultTab = "overview") => {
    setSelectedApplicantId(app.id);
    setApplicantProfileTab(defaultTab);
    setIsEndorsementModalOpen(false);
    setIsApplicantProfileOpen(true);
  };
  const handleOpenVerification = (doc) => {
    setSelectedDocForVerification(doc);
    setIsDocModalOpen(true);
  };
  const handleOpenEndorsement = (app) => {
    setSelectedApplicantId(app.id);
    setIsApplicantProfileOpen(false);
    setIsEndorsementModalOpen(true);
  };
  const currentSectionHeader = useMemo(() => {
    if (role === "TA") {
      const sections2 = {
        dashboard: { badge: "Recruitment Operations", title: "NHO Management", description: "Manage New Hire Orientation schedules, candidate progress, attendance, document clearance, and handoffs." },
        attendance: { badge: "Recruitment Operations", title: "NHO Attendance (Today)", description: "Record show / no-show attendance for candidates scheduled on the selected NHO date, and manage corrections or rescheduling." },
        "applicant-details": { badge: "Recruitment Operations", title: "Applicant NHO Details", description: "Review the selected applicant's NHO progress, documents, agreements, and activity history." },
        "doc-verification": { badge: "Recruitment Operations", title: "Document Verification", description: "Validate uploaded majors, agreements, and supporting onboarding requirements." },
        "it-endorsements": { badge: "Recruitment Operations", title: "IT Endorsements", description: "Review IT endorsement readiness and submit qualified applicants for account provisioning." },
        handoffs: { badge: "Recruitment Operations", title: "NHO Handoffs", description: "Track completed IT requests and manage handoff packages for downstream teams." }
      };
      return sections2[taSubTab] || sections2.dashboard;
    }
    if (role === "Applicant") {
      const sections2 = {
        overview: { badge: "Applicant Portal", title: "My NHO Overview", description: "View your orientation status, onboarding progress, and pending tasks." },
        majors: { badge: "Applicant Portal", title: "Major Requirements", description: "Upload and track the four major pre-employment requirements for verification." },
        orientation: { badge: "Applicant Portal", title: "SiBS Orientation", description: "Review the orientation materials, complete the knowledge check, and acknowledge completion." },
        agreements: { badge: "Applicant Portal", title: "Essential Agreements", description: "Complete the required agreements through signature or signed document upload." },
        requirements: { badge: "Applicant Portal", title: "Non-Major Requirements", description: "Upload supporting onboarding requirements and monitor verification progress." },
        profile: { badge: "Applicant Portal", title: "Personal Information", description: "Review the personal information carried from HRIS before onboarding finalization." },
        "login-sim": { badge: "Applicant Portal", title: "Temporary Access Demo", description: "Simulate temporary access retrieval, activation, and transition to regular login." }
      };
      return sections2[applicantSubTab] || sections2.overview;
    }
    if (role === "IT") {
      const sections2 = {
        queue: { badge: "IT Operations", title: "ID Creation Requests", description: "Review endorsed requests awaiting account provisioning and Kronos assignment." },
        details: { badge: "IT Operations", title: "Request Details & Editing", description: "Inspect IT request details and edit allowed account provisioning fields with audit history." },
        provisioning: { badge: "IT Operations", title: "Manual Kronos Provisioning", description: "Complete account setup, record official Kronos IDs, and close the request." }
      };
      return sections2[itSubTab] || sections2.queue;
    }
    if (role === "WFM") {
      const sections2 = {
        queue: { badge: "Workforce Planning", title: "Production Seating Queue", description: "Review post-IT applicants pending seating and workstation assignment." },
        assignment: { badge: "Workforce Planning", title: "Seat Assignment Form", description: "Assign production wing and workstation details before final HR acceptance." }
      };
      return sections2[wfmSubTab] || sections2.queue;
    }
    const sections = {
      handoffs: { badge: "HR Operations", title: "NHO Handoffs", description: "Review completed NHO packages and confirm downstream onboarding readiness." },
      review: { badge: "HR Operations", title: "Handoff Review & Acceptance", description: "Inspect handoff milestones and accept or return the package with documented reasons." },
      "pending-reqs": { badge: "HR Operations", title: "Pending Requirements (14-Day)", description: "Monitor post-NHO pending requirements, overdue items, and late submissions." }
    };
    return sections[hrSubTab] || sections.handoffs;
  }, [role, taSubTab, applicantSubTab, itSubTab, wfmSubTab, hrSubTab]);
  return <div className="min-w-0 space-y-3.5 sm:space-y-4 2xl:space-y-5 font-jakarta text-sibs-navy">
      {
    /* Role Switcher & Sub-Nav Header */
  }
      <NHORoleHeader
    subTab={getCurrentSubTab()}
    onSubTabChange={handleSubTabChange}
    sectionHeader={currentSectionHeader}
    onOpenStandalonePortal={() => onSwitchModule?.("Employee Public Portal")}
  />

      {
    /* Main Container Content */
  }
      <div className="w-full min-w-0 space-y-3.5 sm:space-y-4 2xl:space-y-5 pb-8">
        {
    /* TA Role Views */
  }
        {role === "TA" && <>
            {taSubTab === "dashboard" && <NHOTADashboard
    onOpenAttendanceModal={handleOpenAttendanceModal}
    onOpenDetails={handleOpenApplicantDetails}
    onOpenEndorsement={handleOpenEndorsement}
  />}

            {taSubTab === "attendance" && <NHOAttendanceView
    onOpenAttendanceModal={handleOpenAttendanceModal}
    onOpenDetails={handleOpenApplicantDetails}
  />}

            {taSubTab === "doc-verification" && <NHODocumentVerificationQueue />}

            {taSubTab === "handoffs" && <NHOHandoffsView
    onOpenApplicantDetails={handleOpenApplicantDetails}
  />}
          </>}

        {
    /* Applicant Role Views */
  }
        {role === "Applicant" && <NHOApplicantPortal
    subTab={applicantSubTab}
    onSubTabChange={setApplicantSubTab}
  />}

        {
    /* IT Role Views */
  }
        {role === "IT" && <NHOITDashboard
    subTab={itSubTab}
    onSubTabChange={setItSubTab}
  />}

        {
    /* QDS and Trainer role views hidden in NHO */
  }
        {(role === "QDS" || role === "Trainer") && <NHOHRDashboard
    subTab={hrSubTab}
    onSubTabChange={setHrSubTab}
    onSwitchModule={onSwitchModule}
  />}


        {
    /* WFM Role Views */
  }
        {role === "WFM" && <NHOWFMDashboard
    subTab={wfmSubTab}
    onSubTabChange={setWfmSubTab}
  />}

        {
    /* HR Role Views */
  }
        {role === "HR" && <NHOHRDashboard
    subTab={hrSubTab}
    onSubTabChange={setHrSubTab}
    onSwitchModule={onSwitchModule}
  />}
      </div>

      {
    /* NHO candidate details open over the records table; no standalone Applicant Details tab. */
  }
      {role === "TA" && isApplicantProfileOpen && <NHOApplicantDetails
    key={`${activeApplicant.id}:${applicantProfileTab}`}
    applicant={activeApplicant}
    initialTab={applicantProfileTab}
    onClose={() => setIsApplicantProfileOpen(false)}
    onOpenAttendance={() => handleOpenAttendanceModal(activeApplicant)}
    onOpenEndorsement={() => handleOpenEndorsement(activeApplicant)}
    onOpenDocVerification={handleOpenVerification}
  />}

      {
    /* IT endorsement remains accessible from the NHO table and profile, not as a top-level tab. */
  }
      {role === "TA" && isEndorsementModalOpen && <NHOITEndorsementModal
    applicant={activeApplicant}
    onClose={() => setIsEndorsementModalOpen(false)}
    onOpenDetails={handleOpenApplicantDetails}
    onOpenAttendance={handleOpenAttendanceModal}
  />}

      {
    /* Attendance Modal */
  }
      {isAttendanceModalOpen && <NHOAttendanceModal
    isOpen={isAttendanceModalOpen}
    onClose={() => setIsAttendanceModalOpen(false)}
    applicant={targetAttendanceApplicant}
  />}

      {
    /* Document Verification Modal */
  }
      {isDocModalOpen && selectedDocForVerification && <NHODocumentVerificationModal
    isOpen={isDocModalOpen}
    onClose={() => {
      setIsDocModalOpen(false);
      setSelectedDocForVerification(null);
    }}
    document={selectedDocForVerification}
    applicantId={activeApplicant.id}
    applicantName={activeApplicant.fullName}
  />}

    </div>;
}
function NHOMainModuleWrapper({ onSwitchModule }) {
  try {
    const context = useNHO();
    if (context && context.applicants) {
      return <NHOInnerModule onSwitchModule={onSwitchModule} />;
    }
  } catch (e) { void e; /* empty */ }
  return <NHOProvider>
      <NHOInnerModule onSwitchModule={onSwitchModule} />
    </NHOProvider>;
}
function NHOMainModule({ onSwitchModule }) {
  return <NHOMainModuleWrapper onSwitchModule={onSwitchModule} />;
}
export {
  NHOMainModule as default
};
