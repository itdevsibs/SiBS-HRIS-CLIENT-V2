import Header from "@/components/layout/Header";
import { PageHeaderHero } from "@/components/ui";
import EmployeeJourneyModule from "@/components/recruitment/journey/EmployeeJourneyModule";
import { useHrisModuleNavigation } from "@/lib/utils/journey/hrisRoleAdapter";

export default function TraineeLearningPage() {
  const handleSwitchModule = useHrisModuleNavigation();

  return (
    <div className="sibs-dashboard-shell font-jakarta flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-3.5 sm:space-y-4 2xl:space-y-5">
          <PageHeaderHero
            kicker="Learning & Probationary Workspace"
            title="Trainee Learning & Progress"
            description="Review assigned training modules, daily/weekly/monthly learning calendars, assessments, and probationary milestones."
          />

          <div>
            <EmployeeJourneyModule
              defaultView="trainee-dashboard"
              onSwitchModule={handleSwitchModule}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
