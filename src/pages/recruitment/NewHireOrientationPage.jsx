import Header from "@/components/layout/Header";
import NHOMainModule from "@/components/recruitment/nho/NHOMainModule";
import { useHrisModuleNavigation } from "@/lib/utils/journey/hrisRoleAdapter";

export default function NewHireOrientationPage() {
  const handleSwitchModule = useHrisModuleNavigation();

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-3.5 sm:space-y-4 2xl:space-y-5">
          <NHOMainModule onSwitchModule={handleSwitchModule} />
        </div>
      </main>
    </div>
  );
}
