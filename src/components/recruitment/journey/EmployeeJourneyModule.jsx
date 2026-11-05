/* eslint-disable no-unused-vars */
import { useDemoAuth, canAccessJourneyTab, defaultJourneyTab } from "@/lib/utils/journey/hrisRoleAdapter";
import { useState, useEffect } from "react";
import { useJourney } from "./JourneyContext";
import TraineeDashboardView from "./views/TraineeDashboardView";
import TrainerMonitoringView from "./views/TrainerMonitoringView";
import QDSDashboardView from "./views/QDSDashboardView";
import BenchmarkView from "./views/BenchmarkView";
import NotificationsView from "./views/NotificationsView";
import ConfigurationView from "./views/ConfigurationView";
import EmployeeJourneyDrillDown from "./drilldown/EmployeeJourneyDrillDown";
import Review306090Modal from "./views/Review306090Modal";
import ESEPCoachingTabView from "./views/ESEPCoachingTabView";
function EmployeeJourneyModule({
  onSwitchModule,
  initialFocusedJourneyId,
  defaultView = "benchmark",
  summaryOnly = false,
  onUpdateStage,
  canUpdateStage,
  demoUser
}) {
  const { journeys, selectedJourney, setSelectedJourney, resetJourneysToDefault } = useJourney();
  const { user } = useDemoAuth();
  const currentRole = (demoUser || user)?.role || "Employee";
  const permittedView = canAccessJourneyTab(currentRole, defaultView) ? defaultView : defaultJourneyTab(currentRole);
  const isPersonalView = currentRole === "Employee";
  const personalJourney = isPersonalView ? journeys.find((j) => j.sibsEmployeeId === user?.journeyEmployeeId || j.id === user?.journeyEmployeeId || user?.email && j.email?.toLowerCase() === user.email.toLowerCase()) : null;
  const [activeView, setActiveView] = useState(permittedView);
  const [linkingJourney, setLinkingJourney] = useState(null);
  useEffect(() => {
    setActiveView(permittedView);
  }, [permittedView]);
  useEffect(() => {
    if (isPersonalView && selectedJourney && selectedJourney.id !== personalJourney?.id) setSelectedJourney(null);
  }, [isPersonalView, selectedJourney, personalJourney?.id, setSelectedJourney]);
  useEffect(() => {
    if (initialFocusedJourneyId) {
      const match = journeys.find(
        (j) => j.id === initialFocusedJourneyId || j.nhoApplicantId === initialFocusedJourneyId || j.kronosId === initialFocusedJourneyId || j.sibsEmployeeId === initialFocusedJourneyId
      );
      if (match && (!isPersonalView || match.id === personalJourney?.id)) {
        setSelectedJourney(match);
      }
    }
  }, [initialFocusedJourneyId, journeys, isPersonalView, personalJourney?.id, setSelectedJourney]);
  return <div className="space-y-6">
      
      {
    /* View Content Renderer */
  }
      {isPersonalView && !personalJourney ? <div className="rounded-2xl bg-white p-7 border border-[#E6ECF2]"><h2 className="font-bold text-[#042C51]">No Employee Journey linked yet</h2><p className="text-sm text-slate-500 mt-2">This demo account is not linked to an employee Journey. An HR demo account can set up the sample record before it appears here.</p></div> : null}
      {(!isPersonalView || personalJourney) && activeView === "trainee-dashboard" && <TraineeDashboardView onSwitchModule={onSwitchModule} />}
      {canAccessJourneyTab(currentRole, "benchmark") && activeView === "benchmark" && <BenchmarkView summaryOnly={summaryOnly} onOpenLinkModal={(j) => setLinkingJourney(j)} onSwitchModule={onSwitchModule} />}
      {canAccessJourneyTab(currentRole, "esep-coaching") && activeView === "esep-coaching" && <ESEPCoachingTabView
    currentJourney={personalJourney || selectedJourney || journeys[0]}
    onSelectEmployee={(j) => setSelectedJourney(j)}
    onSwitchModule={onSwitchModule}
  />}
      {canAccessJourneyTab(currentRole, "trainer-monitoring") && activeView === "trainer-monitoring" && <TrainerMonitoringView onSwitchModule={onSwitchModule} />}
      {canAccessJourneyTab(currentRole, "qds-dashboard") && activeView === "qds-dashboard" && <QDSDashboardView onSwitchModule={onSwitchModule} />}
      {canAccessJourneyTab(currentRole, "notifications") && activeView === "notifications" && <NotificationsView onSwitchModule={onSwitchModule} />}
      {canAccessJourneyTab(currentRole, "configuration") && activeView === "configuration" && <ConfigurationView onSwitchModule={onSwitchModule} />}


      {
    /* In 30 / 60 / 90 Reviews View: Show details about 30 60 90 only without other details */
  }
      {selectedJourney && activeView === "benchmark" && summaryOnly && <EmployeeJourneyDrillDown
    key={selectedJourney.id}
    journey={selectedJourney}
    isOpen
    profileMode
    onUpdateStage={onUpdateStage && (!canUpdateStage || canUpdateStage(selectedJourney)) ? () => onUpdateStage(selectedJourney) : undefined}
    onClose={() => setSelectedJourney(null)}
  />}
      {selectedJourney && activeView === "benchmark" && !summaryOnly && <Review306090Modal
    journey={selectedJourney}
    isOpen={!!selectedJourney}
    onClose={() => setSelectedJourney(null)}
  />}

      {
    /* In other views (excluding esep-coaching where inline selection is used): Employee Journey DrillDown */
  }
      {selectedJourney && activeView !== "benchmark" && activeView !== "esep-coaching" && <EmployeeJourneyDrillDown
    journey={selectedJourney}
    isOpen={!!selectedJourney}
    onClose={() => setSelectedJourney(null)}
  />}

      {
    /* Authorized Linkage Modal trigger from benchmark table if needed */
  }
      {linkingJourney && <EmployeeJourneyDrillDown
    journey={linkingJourney}
    isOpen={!!linkingJourney}
    onClose={() => setLinkingJourney(null)}
    initialTab="timeline"
  />}
    </div>;
}
export {
  EmployeeJourneyModule as default
};
